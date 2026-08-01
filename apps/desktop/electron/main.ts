import { app, BrowserWindow, ipcMain, dialog, Menu, nativeTheme, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { LogManager, ConsoleTransport, createLogger } from '@markmate/logger';
import { FileTransport, attachProcessErrorHandlers } from '@markmate/logger/node';

const logger = createLogger('main');

// 初始化统一日志：控制台 + userData/logs 下的轮转文件
function setupLogging(): void {
  try {
    const logsDir = path.join(app.getPath('userData'), 'logs');
    LogManager.getInstance().configure({
      transports: [
        new ConsoleTransport(),
        new FileTransport({ dir: logsDir, fileName: 'main', level: 'debug' }),
      ],
    });
    attachProcessErrorHandlers(logger);
    logger.info('Logging initialized', { logsDir });
  } catch (error) {
    // userData 路径不可用时保留默认控制台日志
    logger.warn('File logging unavailable, fallback to console only', error);
  }
}
setupLogging();

// __dirname is available in CommonJS (production) and injected by vite-plugin-electron in dev
declare const __dirname: string;

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// Memory and performance limits
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size
const MAX_DIRECTORY_ITEMS = 2000; // Max items to read from directory
const MAX_CACHE_SIZE = 200; // LRU cache size
const MEMORY_CHECK_INTERVAL = 30000; // Check memory every 30 seconds
const GC_TRIGGER_THRESHOLD = 350 * 1024 * 1024; // 350MB trigger threshold
const CACHE_CLEANUP_THRESHOLD = 150; // Start evicting when cache reaches 75%

function getAppRoot(): string {
  if (VITE_DEV_SERVER_URL) {
    return path.join(__dirname, '..');
  }
  return app.getAppPath();
}
function getDistElectron(): string {
  return path.join(getAppRoot(), 'dist-electron');
}
function getDist(): string {
  return path.join(getAppRoot(), 'dist');
}

// Disable Chromium features that are not needed for a markdown editor
app.commandLine.appendSwitch('disable-features', 'TranslateUI,MediaRouter,SpareRendererForSitePerProcess,CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('enable-features', 'CanvasOopRasterization');

// Memory optimization flags
app.commandLine.appendSwitch('js-flags', '--expose-gc --max-old-space-size=384 --initial-old-space-size=128 --max-semi-space-size=8');
app.commandLine.appendSwitch('renderer-process-limit', '2');
app.commandLine.appendSwitch('disable-http-cache');
app.commandLine.appendSwitch('disk-cache-size', '10485760'); // 10MB disk cache

let mainWindow: BrowserWindow | null = null;
let pendingFileToOpen: string | null = null;

interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface AppConfig {
  theme: 'light' | 'dark' | 'system';
  editor: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    tabSize: number;
    wordWrap: boolean;
    showLineNumbers: boolean;
    highlightActiveLine: boolean;
  };
  preview: {
    fontSize: number;
    lineHeight: number;
    maxWidth: number;
  };
  autoSave: {
    enabled: boolean;
    interval: number;
  };
  ui: {
    sidebarWidth: number;
    showStatusBar: boolean;
  };
}

const DEFAULT_CONFIG: AppConfig = {
  theme: 'dark',
  editor: {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    fontSize: 14,
    lineHeight: 1.6,
    tabSize: 2,
    wordWrap: true,
    showLineNumbers: true,
    highlightActiveLine: true,
  },
  preview: {
    fontSize: 16,
    lineHeight: 1.8,
    maxWidth: 900,
  },
  autoSave: {
    enabled: true,
    interval: 30000,
  },
  ui: {
    sidebarWidth: 260,
    showStatusBar: true,
  },
};

let appConfig: AppConfig = { ...DEFAULT_CONFIG };

function getConfigPath(): string {
  return path.join(app.getPath('userData'), 'config.json');
}

async function loadConfig(): Promise<AppConfig> {
  try {
    const configPath = getConfigPath();
    const data = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(data);
    // 深度合并默认配置，确保新增字段有默认值
    return deepMerge(DEFAULT_CONFIG, parsed);
  } catch {
    // 文件不存在或解析失败，使用默认配置
    return { ...DEFAULT_CONFIG };
  }
}

async function saveConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  appConfig = deepMerge(appConfig, config);
  try {
    const configPath = getConfigPath();
    await fs.writeFile(configPath, JSON.stringify(appConfig, null, 2), 'utf-8');
    // 通知渲染进程配置变更
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('config:changed', appConfig);
    }
  } catch (error) {
    logger.error('Failed to save config', error);
  }
  return appConfig;
}

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceVal = (source as any)[key];
      const targetVal = (result as any)[key];
      if (sourceVal !== null && typeof sourceVal === 'object' && !Array.isArray(sourceVal) &&
          targetVal !== null && typeof targetVal === 'object' && !Array.isArray(targetVal)) {
        (result as any)[key] = deepMerge(targetVal, sourceVal);
      } else if (sourceVal !== undefined) {
        (result as any)[key] = sourceVal;
      }
    }
  }
  return result;
}

const ALLOWED_EXTENSIONS = new Set(['.md', '.markdown', '.txt']);

// 获取要打开的文件路径（从命令行参数）
function getFileToOpenFromArgs(argv: string[]): string | null {
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    // 跳过 Electron/程序自身的参数
    if (arg.startsWith('--') || arg.startsWith('-') || arg === '.' || arg === '..') {
      continue;
    }
    // 检查是否是文件路径且扩展名允许
    try {
      const resolved = path.resolve(arg);
      if (isAllowedFile(resolved)) {
        return resolved;
      }
    } catch {
      // 忽略无效路径
    }
  }
  return null;
}

// 打开文件（发送给渲染进程）
function openFilePath(filePath: string): void {
  if (mainWindow && mainWindow.webContents) {
    // 等待窗口准备好后发送
    if (mainWindow.isDestroyed()) return;
    if (!mainWindow.webContents.isLoading()) {
      mainWindow.webContents.send('file:open', filePath);
    } else {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow?.webContents.send('file:open', filePath);
      });
    }
    // 激活窗口
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  } else {
    // 窗口还没创建，保存待打开的文件
    pendingFileToOpen = filePath;
  }
}

// 单实例锁 - 确保只有一个实例运行
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  // 第二个实例启动时，将文件路径发送给第一个实例
  app.on('second-instance', (_event, argv) => {
    const filePath = getFileToOpenFromArgs(argv);
    if (filePath) {
      openFilePath(filePath);
    } else if (mainWindow) {
      // 没有文件时，仅激活窗口
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// macOS: 通过 Dock 或 Finder 打开文件
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (isAllowedFile(filePath)) {
    openFilePath(filePath);
  }
});

// LRU Cache for basenames - proper eviction policy
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Refresh on access (move to end for LRU)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  trimToSize(limit: number): void {
    while (this.cache.size > limit) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey === undefined) break;
      this.cache.delete(firstKey);
    }
  }
}

const basenameCache = new LRUCache<string, string>(MAX_CACHE_SIZE);

function cachedBasename(filePath: string): string {
  let name = basenameCache.get(filePath);
  if (!name) {
    name = path.basename(filePath);
    basenameCache.set(filePath, name);
  }
  return name;
}

function validateAndResolvePath(inputPath: string): string | null {
  try {
    const resolved = path.resolve(inputPath);
    return resolved;
  } catch {
    return null;
  }
}

function isAllowedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext);
}

// Memory monitoring and management
let memoryCheckInterval: ReturnType<typeof setInterval> | null = null;
let lastGCTime = 0;

function checkMemoryAndGC(): void {
  try {
    const mem = process.memoryUsage();
    const now = Date.now();

    // Trigger GC if heap is high and we haven't GC'd recently (at least 15s apart)
    if (mem.heapUsed > GC_TRIGGER_THRESHOLD && (now - lastGCTime) > 15000) {
      if (typeof gc !== 'undefined') {
        gc();
        lastGCTime = now;
      }
    }

    // Trim caches periodically
    if (basenameCache.size > CACHE_CLEANUP_THRESHOLD) {
      basenameCache.trimToSize(100);
    }

    // Notify renderer of memory pressure if critical
    if (mainWindow && mem.heapUsed > 400 * 1024 * 1024) {
      mainWindow.webContents.send('app:memory-pressure', {
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        rss: mem.rss,
      });
    }
  } catch {
    // Ignore memory check errors
  }
}

function startMemoryMonitoring(): void {
  if (memoryCheckInterval) return;
  memoryCheckInterval = setInterval(checkMemoryAndGC, MEMORY_CHECK_INTERVAL);
  if (memoryCheckInterval.unref) {
    memoryCheckInterval.unref();
  }
}

function stopMemoryMonitoring(): void {
  if (memoryCheckInterval) {
    clearInterval(memoryCheckInterval);
    memoryCheckInterval = null;
  }
}

// Directory reading with limits
async function readDirectoryRecursive(
  dirPath: string,
  depth = 0,
  maxDepth = 3,
  itemLimit = MAX_DIRECTORY_ITEMS
): Promise<FileItem[]> {
  if (depth > maxDepth) return [];

  let entries: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const items: FileItem[] = [];

  for (const entry of entries) {
    if (items.length >= itemLimit) break;
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const fullPath = path.join(dirPath, entry.name);
    let isDir = false;
    try {
      isDir = entry.isDirectory();
    } catch {
      continue;
    }

    if (isDir) {
      items.push({ name: entry.name, path: fullPath, isDirectory: true });
    } else {
      if (isAllowedFile(entry.name)) {
        items.push({ name: entry.name, path: fullPath, isDirectory: false });
      }
    }
  }

  // Recurse into directories (depth first, respecting limit)
  if (depth < maxDepth) {
    for (const item of items.filter(i => i.isDirectory)) {
      if (items.length >= itemLimit) break;
      try {
        const subItems = await readDirectoryRecursive(item.path, depth + 1, maxDepth, itemLimit - items.length);
        // Add sub-files only (don't re-add subdirs we already added)
        for (const subItem of subItems) {
          if (items.length >= itemLimit) break;
          if (!subItem.isDirectory) {
            items.push(subItem);
          }
        }
      } catch {
        continue;
      }
    }
  }

  // Folders first, then files; alphabetically within groups
  const collator = new Intl.Collator('zh-CN');
  items.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return collator.compare(a.name, b.name);
  });

  return items.slice(0, itemLimit);
}

// Read single directory level (for lazy loading)
async function readDirectoryFlat(dirPath: string): Promise<FileItem[]> {
  let entries: Awaited<ReturnType<typeof fs.readdir>>;
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }

  const items: FileItem[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

    const fullPath = path.join(dirPath, entry.name);
    let isDir = false;
    try {
      isDir = entry.isDirectory();
    } catch {
      continue;
    }

    if (isDir) {
      items.push({ name: entry.name, path: fullPath, isDirectory: true });
    } else {
      if (isAllowedFile(entry.name)) {
        items.push({ name: entry.name, path: fullPath, isDirectory: false });
      }
    }
  }

  // Folders first, then files; alphabetically within groups
  const collator = new Intl.Collator('zh-CN');
  items.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return collator.compare(a.name, b.name);
  });

  return items;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#1e1e2e',
      symbolColor: '#cdd6f4',
      height: 36,
    },
    backgroundColor: '#1e1e2e',
    show: false,
    paintWhenInitiallyHidden: true,
    webPreferences: {
      preload: path.join(getDistElectron(), 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      spellcheck: false,
      webgl: false,
      // Security: disable unnecessary APIs
      allowRunningInsecureContent: false,
      enableWebSQL: false,
      // Background throttling and memory optimization
      backgroundThrottling: true,
      disableDialogs: false,
    },
  });

  // Enable additional webContents optimization
  mainWindow.webContents.setBackgroundThrottling(true);

  // Show window as soon as first paint happens
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsedUrl = new URL(url);
      if (['http:', 'https:'].includes(parsedUrl.protocol)) {
        shell.openExternal(url, { activate: true });
      }
    } catch {
      // Invalid URL, ignore
    }
    return { action: 'deny' };
  });

  // Add security attributes to external links
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Clean up when page is navigated/reloaded (prevent leaks)
  mainWindow.webContents.on('did-start-loading', () => {
    basenameCache.trimToSize(80);
  });

  // 页面加载完成后，打开待处理的文件
  mainWindow.webContents.on('did-finish-load', () => {
    if (pendingFileToOpen) {
      mainWindow?.webContents.send('file:open', pendingFileToOpen);
      pendingFileToOpen = null;
    }
  });

  if (VITE_DEV_SERVER_URL) {
    // [临时诊断] 捕获渲染进程控制台/崩溃/preload 错误，写入主进程日志
    mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
      logger.info(`[renderer:${level}] ${message}`, { line, sourceId });
    });
    mainWindow.webContents.on('render-process-gone', (_e, details) => {
      logger.error('[renderer] process gone', details);
    });
    mainWindow.webContents.on('did-fail-load', (_e, errorCode, errorDescription) => {
      logger.error('[renderer] did-fail-load', { errorCode, errorDescription });
    });
    mainWindow.webContents.on('preload-error', (_e, preloadPath, error) => {
      logger.error('[preload] error', { preloadPath, error: String(error) });
    });
    await mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(getDist(), 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Before-close confirmation for unsaved changes
  let isClosing = false;
  mainWindow.on('close', async (event) => {
    if (isClosing) return;
    event.preventDefault();

    if (!mainWindow || mainWindow.isDestroyed()) {
      isClosing = true;
      mainWindow?.destroy();
      return;
    }

    try {
      // Ask renderer if there are unsaved changes
      const hasUnsaved = await mainWindow.webContents
        .executeJavaScript('window.__MARKMATE_DIRTY__ ?? false')
        .catch(() => false);

      if (!hasUnsaved) {
        isClosing = true;
        mainWindow.close();
        return;
      }

      // Show native confirmation dialog
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        title: '未保存的更改',
        message: '文件有未保存的更改',
        detail: '您希望在关闭前保存更改吗？',
        buttons: ['保存', '不保存', '取消'],
        defaultId: 0,
        cancelId: 2,
        noLink: true,
      });

      if (response === 2) {
        // Cancel - don't close
        return;
      }

      if (response === 0) {
        // Save - tell renderer to save, then close
        const saved = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 15000);

          const onSaved = () => {
            clearTimeout(timeout);
            ipcMain.removeListener('app:saved-for-close', onSaved);
            resolve(true);
          };

          ipcMain.once('app:saved-for-close', onSaved);
          mainWindow?.webContents.send('file:save');
        });

        if (!saved) {
          // Save failed or timed out, ask user again
          const { response: retryResponse } = await dialog.showMessageBox(mainWindow!, {
            type: 'error',
            title: '保存失败',
            message: '文件保存失败或超时',
            detail: '仍要关闭吗？未保存的更改将丢失。',
            buttons: ['仍然关闭', '取消'],
            defaultId: 1,
            cancelId: 1,
            noLink: true,
          });
          if (retryResponse !== 0) return;
        }
      }

      // Close (either saved or chose "don't save")
      isClosing = true;
      mainWindow.close();
    } catch (error) {
      logger.error('Close confirmation error', error);
      isClosing = true;
      mainWindow.close();
    }
  });

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window:maximized-changed', false);
  });

  // Start memory monitoring after window loads
  startMemoryMonitoring();
}

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
    ...(isMac
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'services' },
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        }]
      : []),
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件...',
          accelerator: 'Ctrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile'],
              filters: [
                { name: 'Markdown 文件', extensions: ['md', 'markdown', 'txt'] },
                { name: '所有文件', extensions: ['*'] },
              ],
            });
            if (!result.canceled && result.filePaths[0]) {
              mainWindow?.webContents.send('file:open', result.filePaths[0]);
            }
          },
        },
        {
          label: '打开文件夹...',
          accelerator: 'Ctrl+Shift+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openDirectory'],
            });
            if (!result.canceled && result.filePaths[0]) {
              mainWindow?.webContents.send('folder:open', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'Ctrl+S',
          click: () => mainWindow?.webContents.send('file:save'),
        },
        {
          label: '另存为...',
          accelerator: 'Ctrl+Shift+S',
          click: () => mainWindow?.webContents.send('file:save-as'),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 MarkMate',
          click: () => {
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 MarkMate',
              message: 'MarkMate',
              detail: '专业的 Markdown 文档编辑器\n版本 0.1.0\n\n基于 Electron + React 构建',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function registerIpcHandlers() {
  ipcMain.handle('dialog:open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        { name: 'Markdown 文件', extensions: ['md', 'markdown', 'txt'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('dialog:open-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory'],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('dialog:save-file', async (_event, defaultPath?: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath,
      filters: [
        { name: 'Markdown 文件', extensions: ['md'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    });
    if (result.canceled) return null;
    return result.filePath;
  });

  ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
    const resolvedPath = validateAndResolvePath(filePath);
    if (!resolvedPath) {
      return { success: false, error: '无效的文件路径' };
    }
    try {
      // Check file size before reading
      const stats = await fs.stat(resolvedPath);
      if (stats.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `文件过大（${(stats.size / 1024 / 1024).toFixed(1)}MB），最大支持 ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
        };
      }
      if (stats.size === 0) {
        return { success: true, content: '' };
      }

      const content = await fs.readFile(resolvedPath, 'utf-8');
      return { success: true, content, size: stats.size };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:write-file', async (_event, filePath: string, content: string) => {
    const resolvedPath = validateAndResolvePath(filePath);
    if (!resolvedPath) {
      return { success: false, error: '无效的文件路径' };
    }
    try {
      // Check content size
      const contentSize = Buffer.byteLength(content, 'utf-8');
      if (contentSize > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `内容过大（${(contentSize / 1024 / 1024).toFixed(1)}MB），最大支持 ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
        };
      }

      await fs.writeFile(resolvedPath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:read-directory', async (_event, dirPath: string) => {
    const resolvedPath = validateAndResolvePath(dirPath);
    if (!resolvedPath) {
      return { success: false, error: '无效的目录路径' };
    }
    try {
      const items = await readDirectoryRecursive(resolvedPath);
      return { success: true, items, truncated: items.length >= MAX_DIRECTORY_ITEMS };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('fs:read-directory-flat', async (_event, dirPath: string) => {
    const resolvedPath = validateAndResolvePath(dirPath);
    if (!resolvedPath) {
      return { success: false, error: '无效的目录路径' };
    }
    try {
      const items = await readDirectoryFlat(resolvedPath);
      return { success: true, items };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('app:get-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle('app:set-theme', (_event, theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      nativeTheme.themeSource = 'system';
    } else {
      nativeTheme.themeSource = theme;
    }
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('path:basename', (_event, filePath: string) => {
    return cachedBasename(filePath);
  });

  ipcMain.handle('path:dirname', (_event, filePath: string) => {
    return path.dirname(filePath);
  });

  ipcMain.handle('path:join', (_event, ...paths: string[]) => {
    return path.join(...paths);
  });

  // Memory info IPC
  ipcMain.handle('app:get-memory-info', () => {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
      external: mem.external,
    };
  });

  // Force GC from renderer (used during idle/navigation)
  ipcMain.handle('app:trigger-gc', () => {
    try {
      if (typeof gc !== 'undefined') {
        gc();
        basenameCache.trimToSize(50);
      }
    } catch {
      // ignore
    }
  });

  // Config IPC handlers
  ipcMain.handle('config:get', () => {
    return appConfig;
  });

  ipcMain.handle('config:set', async (_event, config: Partial<AppConfig>) => {
    const newConfig = await saveConfig(config);
    // Apply theme immediately
    if (config.theme) {
      nativeTheme.themeSource = config.theme;
    }
    return newConfig;
  });

  ipcMain.handle('config:reset', async () => {
    appConfig = { ...DEFAULT_CONFIG };
    try {
      const configPath = getConfigPath();
      await fs.writeFile(configPath, JSON.stringify(appConfig, null, 2), 'utf-8');
      nativeTheme.themeSource = appConfig.theme;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('config:changed', appConfig);
      }
    } catch (error) {
      logger.error('Failed to reset config', error);
    }
    return appConfig;
  });
}

// Register handlers and create menu before app is ready
registerIpcHandlers();

app.whenReady().then(async () => {
  logger.info('App ready', { version: app.getVersion(), platform: process.platform });
  // 加载配置
  appConfig = await loadConfig();
  // 应用主题设置
  nativeTheme.themeSource = appConfig.theme;

  // 从命令行参数获取初始要打开的文件
  const initialFile = getFileToOpenFromArgs(process.argv);
  if (initialFile) {
    pendingFileToOpen = initialFile;
  }

  setImmediate(() => {
    createMenu();
    createWindow();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopMemoryMonitoring();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clear caches on quit
app.on('before-quit', () => {
  stopMemoryMonitoring();
  basenameCache.clear();
});
