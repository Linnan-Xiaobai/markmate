import { vi } from 'vitest';
import { VirtualFileSystem } from './virtual-fs';
import type { MockAppConfig } from '../factories';
import { createMockConfig } from '../factories';

type UnsubscribeFn = () => void;

/** 与 apps/desktop electron/preload.ts 暴露的 window.markmate 结构一致 */
export interface MockMarkmateAPI {
  dialog: {
    openFile: () => Promise<string | null>;
    openFolder: () => Promise<string | null>;
    saveFile: (defaultPath?: string) => Promise<string | null>;
  };
  fs: {
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; size?: number; error?: string }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    readDirectory: (dirPath: string) => Promise<{ success: boolean; items?: { name: string; path: string; isDirectory: boolean }[]; truncated?: boolean; error?: string }>;
    readDirectoryFlat: (dirPath: string) => Promise<{ success: boolean; items?: { name: string; path: string; isDirectory: boolean }[]; error?: string }>;
  };
  app: {
    getTheme: () => Promise<'light' | 'dark'>;
    setTheme: (theme: 'light' | 'dark' | 'system') => Promise<'light' | 'dark'>;
    getMemoryInfo: () => Promise<{ heapUsed: number; heapTotal: number; rss: number; external: number }>;
    triggerGC: () => Promise<void>;
    onMemoryPressure: (callback: (info: { heapUsed: number; heapTotal: number; rss: number }) => void) => UnsubscribeFn;
    notifySavedForClose: () => void;
  };
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => UnsubscribeFn;
  };
  path: {
    basename: (filePath: string) => Promise<string>;
    dirname: (filePath: string) => Promise<string>;
    join: (...paths: string[]) => Promise<string>;
  };
  config: {
    get: () => Promise<MockAppConfig>;
    set: (config: Partial<MockAppConfig>) => Promise<MockAppConfig>;
    reset: () => Promise<MockAppConfig>;
    onChange: (callback: (config: MockAppConfig) => void) => UnsubscribeFn;
  };
  on: {
    fileOpen: (callback: (filePath: string) => void) => UnsubscribeFn;
    folderOpen: (callback: (folderPath: string) => void) => UnsubscribeFn;
    fileSave: (callback: () => void) => UnsubscribeFn;
    fileSaveAs: (callback: () => void) => UnsubscribeFn;
  };
}

export interface MarkmateMockOptions {
  /** 初始虚拟文件系统内容：路径 → 文件内容 */
  files?: Record<string, string>;
  /** 初始配置，会与默认配置深度合并 */
  config?: Partial<MockAppConfig>;
  /** 初始主题，默认 'dark' */
  theme?: 'light' | 'dark';
  /** 对话框返回值预设 */
  dialogs?: {
    openFile?: string | null;
    openFolder?: string | null;
    saveFile?: string | null;
  };
  /** 错误注入：true 使用默认错误信息，字符串自定义 */
  failOn?: {
    readFile?: boolean | string;
    writeFile?: boolean | string;
    readDirectory?: boolean | string;
  };
}

export interface MarkmateMock {
  /** 可直接赋给 window.markmate 的 API 对象 */
  readonly api: MockMarkmateAPI;
  /** 底层虚拟文件系统，可直接增删文件 */
  readonly vfs: VirtualFileSystem;
  /** 安装到 window.markmate */
  install(): void;
  /** 从 window 上移除 */
  uninstall(): void;
  /** 当前配置快照 */
  getConfig(): MockAppConfig;
  /** 当前主题 */
  getTheme(): 'light' | 'dark';
  /** 模拟主进程推送事件 */
  emit: {
    fileOpen(filePath: string): void;
    folderOpen(folderPath: string): void;
    fileSave(): void;
    fileSaveAs(): void;
    configChange(config?: MockAppConfig): void;
    memoryPressure(info: { heapUsed: number; heapTotal: number; rss: number }): void;
    maximizedChange(isMaximized: boolean): void;
  };
  /** 关键方法 spy，用于断言调用 */
  spies: {
    readFile: ReturnType<typeof vi.fn>;
    writeFile: ReturnType<typeof vi.fn>;
    configGet: ReturnType<typeof vi.fn>;
    configSet: ReturnType<typeof vi.fn>;
    notifySavedForClose: ReturnType<typeof vi.fn>;
  };
}

type EventCallback = (payload?: unknown) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(target: T, source: Record<string, unknown>): T {
  const result: Record<string, unknown> = { ...target };
  for (const [key, sourceVal] of Object.entries(source)) {
    const targetVal = result[key];
    if (isRecord(sourceVal) && isRecord(targetVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result as T;
}

/**
 * 创建 window.markmate 全量 Mock：虚拟文件系统 + 可观察的配置存储 + 事件总线。
 * 行为对齐 Electron 主进程：config.set 会触发 config:changed。
 */
export function createMarkmateMock(options: MarkmateMockOptions = {}): MarkmateMock {
  const vfs = new VirtualFileSystem(options.files ?? {});
  let config = deepMerge(
    createMockConfig() as unknown as Record<string, unknown>,
    (options.config ?? {}) as Record<string, unknown>
  ) as unknown as MockAppConfig;
  let theme: 'light' | 'dark' = options.theme ?? 'dark';
  let maximized = false;

  const listeners = new Map<string, Set<EventCallback>>();
  const subscribe = (channel: string) => (callback: EventCallback): UnsubscribeFn => {
    if (!listeners.has(channel)) listeners.set(channel, new Set());
    listeners.get(channel)?.add(callback);
    return () => listeners.get(channel)?.delete(callback);
  };
  const publish = (channel: string, payload?: unknown) => {
    for (const callback of listeners.get(channel) ?? []) {
      callback(payload);
    }
  };

  const errorMessage = (flag: boolean | string | undefined, fallback: string): string | null => {
    if (!flag) return null;
    return typeof flag === 'string' ? flag : fallback;
  };

  const spies = {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    configGet: vi.fn(),
    configSet: vi.fn(),
    notifySavedForClose: vi.fn(),
  };

  const memoryInfo = { heapUsed: 80 * 1024 * 1024, heapTotal: 200 * 1024 * 1024, rss: 300 * 1024 * 1024, external: 10 * 1024 * 1024 };

  const api: MockMarkmateAPI = {
    dialog: {
      openFile: async () => options.dialogs?.openFile ?? null,
      openFolder: async () => options.dialogs?.openFolder ?? null,
      saveFile: async (defaultPath?: string) => options.dialogs?.saveFile ?? defaultPath ?? null,
    },
    fs: {
      readFile: async (filePath: string) => {
        spies.readFile(filePath);
        const injected = errorMessage(options.failOn?.readFile, 'Mock read failure');
        if (injected) return { success: false, error: injected };
        return vfs.readFile(filePath);
      },
      writeFile: async (filePath: string, content: string) => {
        spies.writeFile(filePath, content);
        const injected = errorMessage(options.failOn?.writeFile, 'Mock write failure');
        if (injected) return { success: false, error: injected };
        return vfs.writeFile(filePath, content);
      },
      readDirectory: async (dirPath: string) => {
        const injected = errorMessage(options.failOn?.readDirectory, 'Mock readdir failure');
        if (injected) return { success: false, error: injected };
        return vfs.readDirectory(dirPath);
      },
      readDirectoryFlat: async (dirPath: string) => vfs.readDirectory(dirPath),
    },
    app: {
      getTheme: async () => theme,
      setTheme: async (next: 'light' | 'dark' | 'system') => {
        theme = next === 'system' ? 'light' : next;
        return theme;
      },
      getMemoryInfo: async () => ({ ...memoryInfo }),
      triggerGC: async () => undefined,
      onMemoryPressure: (callback) => subscribe('app:memory-pressure')(callback as EventCallback),
      notifySavedForClose: () => {
        spies.notifySavedForClose();
      },
    },
    window: {
      minimize: async () => undefined,
      maximize: async () => {
        maximized = !maximized;
        publish('window:maximized-changed', maximized);
      },
      close: async () => undefined,
      isMaximized: async () => maximized,
      onMaximizedChange: (callback) => subscribe('window:maximized-changed')(callback as EventCallback),
    },
    path: {
      basename: async (filePath: string) => {
        const normalized = filePath.replace(/\\/g, '/');
        return normalized.slice(normalized.lastIndexOf('/') + 1);
      },
      dirname: async (filePath: string) => {
        const normalized = filePath.replace(/\\/g, '/');
        const idx = normalized.lastIndexOf('/');
        return idx <= 0 ? '' : normalized.slice(0, idx);
      },
      join: async (...paths: string[]) => paths.join('/').replace(/\/+/g, '/'),
    },
    config: {
      get: async () => {
        spies.configGet();
        return structuredClone(config);
      },
      set: async (partial: Partial<MockAppConfig>) => {
        spies.configSet(partial);
        config = deepMerge(
          config as unknown as Record<string, unknown>,
          partial as Record<string, unknown>
        ) as unknown as MockAppConfig;
        publish('config:changed', structuredClone(config));
        return structuredClone(config);
      },
      reset: async () => {
        config = createMockConfig();
        publish('config:changed', structuredClone(config));
        return structuredClone(config);
      },
      onChange: (callback) => subscribe('config:changed')(callback as EventCallback),
    },
    on: {
      fileOpen: (callback) => subscribe('file:open')(callback as EventCallback),
      folderOpen: (callback) => subscribe('folder:open')(callback as EventCallback),
      fileSave: (callback) => subscribe('file:save')(callback as EventCallback),
      fileSaveAs: (callback) => subscribe('file:save-as')(callback as EventCallback),
    },
  };

  const installTarget = globalThis as Record<string, unknown>;

  return {
    api,
    vfs,
    install() {
      installTarget.markmate = api;
    },
    uninstall() {
      // 只移除自己安装的实例，避免误删后续测试重新安装的 Mock
      if (installTarget.markmate === api) {
        delete installTarget.markmate;
      }
    },
    getConfig: () => structuredClone(config),
    getTheme: () => theme,
    emit: {
      fileOpen: (filePath: string) => publish('file:open', filePath),
      folderOpen: (folderPath: string) => publish('folder:open', folderPath),
      fileSave: () => publish('file:save'),
      fileSaveAs: () => publish('file:save-as'),
      configChange: (next?: MockAppConfig) => publish('config:changed', next ?? structuredClone(config)),
      memoryPressure: (info) => publish('app:memory-pressure', info),
      maximizedChange: (value: boolean) => publish('window:maximized-changed', value),
    },
    spies,
  };
}

/**
 * 一步安装 window.markmate Mock，返回句柄。
 * 配合 MockManager 使用：mockManager.register('markmate-api', () => mock.uninstall())
 */
export function installMarkmateAPIMock(options: MarkmateMockOptions = {}): MarkmateMock {
  const mock = createMarkmateMock(options);
  mock.install();
  return mock;
}
