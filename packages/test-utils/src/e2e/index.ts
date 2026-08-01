import { createMockFileTree, createMockMarkdown } from '../factories';
import type { MarkmateMockOptions } from '../mocks/markmate-api';

/**
 * E2E 标准工作区文件树：嵌套目录 + 多种 Markdown 特性，
 * 供 Playwright/Spectron 类端到端测试种子数据使用。
 */
export const E2E_FILE_TREE: Record<string, string> = {
  ...createMockFileTree({ depth: 2, breadth: 2, filesPerDir: 2, root: '/e2e-workspace' }),
  '/e2e-workspace/welcome.md': createMockMarkdown({ title: 'E2E Welcome', gfm: true, frontmatter: true }),
  '/e2e-workspace/notes/待办.md': '# 待办事项\n\n- [ ] 编写 E2E 用例\n- [x] 搭建 Mock 体系\n',
};

/** E2E 常用配置预设 */
export const E2E_CONFIG_PRESETS = {
  default: {},
  lightTheme: { theme: 'light' as const },
  autoSaveOff: { autoSave: { enabled: false, interval: 30000 } },
  compactLayout: { ui: { sidebarWidth: 200, showStatusBar: false } },
};

/**
 * 生成可注入浏览器/Electron 页面的初始化脚本字符串，
 * 在页面上下文安装轻量 window.markmate Mock。
 * 用法（Playwright）：await page.addInitScript(createMarkmateInitScript({ files: E2E_FILE_TREE }))
 *
 * 注意：脚本是自包含的，不依赖测试进程中的任何模块。
 */
export function createMarkmateInitScript(options: MarkmateMockOptions = {}): string {
  const files = options.files ?? E2E_FILE_TREE;
  const config = options.config ?? {};
  const theme = options.theme ?? 'dark';

  return `(() => {
  const files = new Map(Object.entries(${JSON.stringify(files)}));
  let config = ${JSON.stringify(config)};
  let theme = ${JSON.stringify(theme)};
  const listeners = new Map();
  const on = (ch) => (cb) => {
    if (!listeners.has(ch)) listeners.set(ch, new Set());
    listeners.get(ch).add(cb);
    return () => listeners.get(ch).delete(cb);
  };
  const normalize = (p) => p.replace(/\\\\/g, '/');
  window.markmate = {
    dialog: {
      openFile: async () => null,
      openFolder: async () => null,
      saveFile: async (p) => p ?? null,
    },
    fs: {
      readFile: async (p) => {
        const c = files.get(normalize(p));
        return c === undefined
          ? { success: false, error: 'File not found: ' + p }
          : { success: true, content: c, size: new TextEncoder().encode(c).length };
      },
      writeFile: async (p, c) => { files.set(normalize(p), c); return { success: true }; },
      readDirectory: async () => ({ success: true, items: [] }),
      readDirectoryFlat: async () => ({ success: true, items: [] }),
    },
    app: {
      getTheme: async () => theme,
      setTheme: async (t) => { theme = t === 'system' ? 'light' : t; return theme; },
      getMemoryInfo: async () => ({ heapUsed: 0, heapTotal: 0, rss: 0, external: 0 }),
      triggerGC: async () => undefined,
      onMemoryPressure: on('app:memory-pressure'),
      notifySavedForClose: () => undefined,
    },
    window: {
      minimize: async () => undefined,
      maximize: async () => undefined,
      close: async () => undefined,
      isMaximized: async () => false,
      onMaximizedChange: on('window:maximized-changed'),
    },
    path: {
      basename: async (p) => normalize(p).split('/').pop(),
      dirname: async (p) => normalize(p).split('/').slice(0, -1).join('/'),
      join: async (...ps) => ps.join('/'),
    },
    config: {
      get: async () => JSON.parse(JSON.stringify(config)),
      set: async (partial) => { config = { ...config, ...partial }; return config; },
      reset: async () => config,
      onChange: on('config:changed'),
    },
    on: {
      fileOpen: on('file:open'),
      folderOpen: on('folder:open'),
      fileSave: on('file:save'),
      fileSaveAs: on('file:save-as'),
    },
    __emit: (ch, payload) => { for (const cb of listeners.get(ch) ?? []) cb(payload); },
  };
})();`;
}
