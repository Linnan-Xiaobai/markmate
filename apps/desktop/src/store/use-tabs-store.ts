import { create } from 'zustand';

export type ViewMode = 'edit' | 'preview' | 'split';

export interface Tab {
  id: string;
  filePath: string | null;
  fileName: string;
  content: string;
  isDirty: boolean;
  cursorLine: number;
  cursorColumn: number;
  wordCount: number;
  charCount: number;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
}

type ErrorCallback = (message: string) => void;

const DEFAULT_CONTENT = `# 欢迎使用 MarkMate

这是一个专业的 Markdown 文档编辑器。

## 开始使用

- 点击 **文件** → **打开文件** 打开一个 Markdown 文件
- 点击 **文件** → **打开文件夹** 浏览整个目录
- 使用快捷键 \`Ctrl+S\` 保存文件
- 使用 \`Ctrl+/\` 切换编辑/预览模式
- 使用 \`Ctrl+N\` 新建标签页
- 使用 \`Ctrl+W\` 关闭当前标签页
- 使用 \`Ctrl+Tab\` 切换标签页

## 功能特性

1. **实时预览** - 编辑时即时查看渲染效果
2. **语法高亮** - 代码块支持多语言高亮
3. **文件树** - 快速导航目录中的文件
4. **多标签** - 同时编辑多个文件
5. **自动保存** - 不再担心丢失修改
6. **深色主题** - 护眼的 Catppuccin Mocha 配色

\`\`\`javascript
console.log("Hello, MarkMate!");
\`\`\`

> Markdown 让写作变得简单而优雅。
`;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const cjk = (trimmed.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  const latin = trimmed.replace(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return cjk + latin;
}

const LARGE_FILE_WARN_BYTES = 2 * 1024 * 1024; // Warn for files > 2MB

function createTab(overrides?: Partial<Tab>): Tab {
  const content = overrides?.content ?? DEFAULT_CONTENT;
  return {
    id: Math.random().toString(36).slice(2, 11),
    filePath: null,
    fileName: '未命名.md',
    content,
    isDirty: false,
    cursorLine: 1,
    cursorColumn: 1,
    wordCount: countWords(content),
    charCount: content.length,
    ...overrides,
  };
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  currentFolder: string | null;
  fileTree: FileNode[];
  errorCallback: ErrorCallback | null;
  autoSaveConfig: { enabled: boolean; interval: number };

  // Derived getters (helpers)
  getActiveTab: () => Tab | undefined;
  isDirty: () => boolean;
  isSaving: () => boolean;

  // Tab management
  newTab: (initialContent?: string) => void;
  closeTab: (tabId: string) => void;
  closeActiveTab: () => void;
  closeOtherTabs: (tabId: string) => void;
  closeAllTabs: () => void;
  setActiveTab: (tabId: string) => void;
  moveTab: (fromIndex: number, toIndex: number) => void;

  // Active tab content operations
  setContent: (content: string) => void;
  setCursorPosition: (line: number, column: number) => void;

  // File operations
  openFile: (filePath: string) => Promise<void>;
  saveFile: () => Promise<void>;
  saveFileAs: () => Promise<void>;
  saveAllFiles: () => Promise<void>;

  // UI state
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setCurrentFolder: (folder: string | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  setErrorCallback: (callback: ErrorCallback | null) => void;
  setAutoSaveConfig: (config: { enabled: boolean; interval: number }) => void;
}

export const useTabsStore = create<TabsState>((set, get) => {
  let countTimer: ReturnType<typeof setTimeout> | null = null;
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let isSavingMap = new Map<string, boolean>();

  function scheduleCount(tabId: string) {
    if (countTimer) clearTimeout(countTimer);
    countTimer = setTimeout(() => {
      const tab = get().tabs.find((t) => t.id === tabId);
      if (tab) {
        updateTab(tabId, {
          wordCount: countWords(tab.content),
          charCount: tab.content.length,
        });
      }
    }, 200);
  }

  function updateTab(tabId: string, updates: Partial<Tab>) {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, ...updates } : t)),
    }));
  }

  function clearAutoSaveTimer() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  function scheduleAutoSave(tabId: string) {
    clearAutoSaveTimer();
    const tab = get().tabs.find((t) => t.id === tabId);
    const { autoSaveConfig } = get();
    if (!autoSaveConfig.enabled || !tab?.filePath || !tab?.isDirty) {
      return;
    }
    autoSaveTimer = setTimeout(async () => {
      const currentTab = get().tabs.find((t) => t.id === tabId);
      if (!currentTab?.filePath || !currentTab?.isDirty) return;

      try {
        const result = await window.markmate.fs.writeFile(currentTab.filePath, currentTab.content);
        if (result.success) {
          updateTab(tabId, { isDirty: false });
        }
      } catch {
        // Silently fail
      }
    }, autoSaveConfig.interval);
  }

  return {
    tabs: [createTab()],
    activeTabId: null,
    viewMode: 'split',
    sidebarOpen: true,
    currentFolder: null,
    fileTree: [],
    errorCallback: null,
    autoSaveConfig: { enabled: true, interval: 30000 },

    getActiveTab: () => {
      const { tabs, activeTabId } = get();
      if (!activeTabId) return tabs[0];
      return tabs.find((t) => t.id === activeTabId) ?? tabs[0];
    },

    isDirty: () => {
      const tab = get().getActiveTab();
      return tab?.isDirty ?? false;
    },

    isSaving: () => {
      const tab = get().getActiveTab();
      return tab ? isSavingMap.get(tab.id) ?? false : false;
    },

    newTab: (initialContent) => {
      clearAutoSaveTimer();
      const tab = createTab({ content: initialContent });
      set((state) => ({
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      }));
    },

    closeTab: (tabId) => {
      const { tabs, activeTabId } = get();
      const tab = tabs.find((t) => t.id === tabId);

      if (tab?.isDirty) {
        const confirmed = window.confirm(`文件 "${tab.fileName}" 有未保存的更改，确定关闭吗？`);
        if (!confirmed) return;
      }

      const newTabs = tabs.filter((t) => t.id !== tabId);
      isSavingMap.delete(tabId);

      // If no tabs left, create a new one
      if (newTabs.length === 0) {
        const newTab = createTab();
        set({ tabs: [newTab], activeTabId: newTab.id });
        return;
      }

      // If closing active tab, activate the next or previous one
      if (activeTabId === tabId) {
        const closedIndex = tabs.findIndex((t) => t.id === tabId);
        const newActiveTab = newTabs[Math.min(closedIndex, newTabs.length - 1)];
        set({ tabs: newTabs, activeTabId: newActiveTab.id });
      } else {
        set({ tabs: newTabs });
      }
    },

    closeActiveTab: () => {
      const { activeTabId } = get();
      if (activeTabId) {
        get().closeTab(activeTabId);
      }
    },

    closeOtherTabs: (tabId) => {
      const { tabs } = get();
      const dirtyTabs = tabs.filter((t) => t.id !== tabId && t.isDirty);
      if (dirtyTabs.length > 0) {
        const names = dirtyTabs.map((t) => t.fileName).join('、');
        const confirmed = window.confirm(`以下文件有未保存的更改：${names}，确定关闭吗？`);
        if (!confirmed) return;
      }

      set((state) => {
        const newTabs = state.tabs.filter((t) => t.id === tabId);
        return { tabs: newTabs, activeTabId: tabId };
      });
    },

    closeAllTabs: () => {
      const { tabs } = get();
      const dirtyTabs = tabs.filter((t) => t.isDirty);
      if (dirtyTabs.length > 0) {
        const names = dirtyTabs.map((t) => t.fileName).join('、');
        const confirmed = window.confirm(`以下文件有未保存的更改：${names}，确定关闭吗？`);
        if (!confirmed) return;
      }

      const newTab = createTab();
      set({ tabs: [newTab], activeTabId: newTab.id });
    },

    setActiveTab: (tabId) => {
      set({ activeTabId: tabId });
    },

    moveTab: (fromIndex, toIndex) => {
      set((state) => {
        const newTabs = [...state.tabs];
        const [moved] = newTabs.splice(fromIndex, 1);
        newTabs.splice(toIndex, 0, moved);
        return { tabs: newTabs };
      });
    },

    setContent: (content) => {
      const tab = get().getActiveTab();
      if (!tab) return;

      updateTab(tab.id, { content, isDirty: true });
      scheduleCount(tab.id);
      scheduleAutoSave(tab.id);
    },

    setCursorPosition: (line, column) => {
      const tab = get().getActiveTab();
      if (!tab) return;
      updateTab(tab.id, { cursorLine: line, cursorColumn: column });
    },

    openFile: async (filePath) => {
      clearAutoSaveTimer();

      // Check if file is already open
      const { tabs } = get();
      const existingTab = tabs.find((t) => t.filePath === filePath);
      if (existingTab) {
        set({ activeTabId: existingTab.id });
        return;
      }

      const result = await window.markmate.fs.readFile(filePath);
      if (result.success && result.content !== undefined) {
        const name = await window.markmate.path.basename(filePath);

        const currentTab = get().getActiveTab();
        const isCurrentUntouched = currentTab && !currentTab.isDirty && !currentTab.filePath;

        if (isCurrentUntouched && currentTab) {
          // Replace current untouched tab
          updateTab(currentTab.id, {
            filePath,
            fileName: name,
            content: result.content,
            isDirty: false,
            wordCount: countWords(result.content),
            charCount: result.content.length,
          });
        } else {
          // Create new tab
          const newTab = createTab({
            filePath,
            fileName: name,
            content: result.content,
            isDirty: false,
            wordCount: countWords(result.content),
            charCount: result.content.length,
          });
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
          }));
        }

        // Warn for large files
        const fileSize = result.size ?? result.content.length;
        if (fileSize > LARGE_FILE_WARN_BYTES) {
          const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
          get().errorCallback?.(`大文件提示：文件大小 ${sizeMB}MB，部分高级功能已自动禁用以节省内存`);
        }
      } else {
        const errorMsg = result.error || '无法读取文件';
        get().errorCallback?.(errorMsg);
      }
    },

    saveFile: async () => {
      const tab = get().getActiveTab();
      if (!tab) return;

      clearAutoSaveTimer();
      isSavingMap.set(tab.id, true);

      let targetPath = tab.filePath;
      if (!targetPath) {
        targetPath = await window.markmate.dialog.saveFile(tab.fileName || '未命名.md');
        if (!targetPath) {
          isSavingMap.set(tab.id, false);
          return;
        }
      }

      const result = await window.markmate.fs.writeFile(targetPath, tab.content);
      if (result.success) {
        const name = await window.markmate.path.basename(targetPath);
        updateTab(tab.id, {
          filePath: targetPath,
          fileName: name,
          isDirty: false,
        });
      } else {
        get().errorCallback?.(result.error || '保存文件失败');
      }
      isSavingMap.set(tab.id, false);
    },

    saveFileAs: async () => {
      const tab = get().getActiveTab();
      if (!tab) return;

      clearAutoSaveTimer();
      isSavingMap.set(tab.id, true);

      const defaultPath = tab.filePath || tab.fileName || '未命名.md';
      const targetPath = await window.markmate.dialog.saveFile(defaultPath);
      if (!targetPath) {
        isSavingMap.set(tab.id, false);
        return;
      }

      const result = await window.markmate.fs.writeFile(targetPath, tab.content);
      if (result.success) {
        const name = await window.markmate.path.basename(targetPath);
        updateTab(tab.id, {
          filePath: targetPath,
          fileName: name,
          isDirty: false,
        });
      } else {
        get().errorCallback?.(result.error || '保存文件失败');
      }
      isSavingMap.set(tab.id, false);
    },

    saveAllFiles: async () => {
      const { tabs } = get();
      for (const tab of tabs) {
        if (tab.isDirty && tab.filePath) {
          try {
            await window.markmate.fs.writeFile(tab.filePath, tab.content);
            updateTab(tab.id, { isDirty: false });
          } catch {
            get().errorCallback?.(`保存 ${tab.fileName} 失败`);
          }
        }
      }
    },

    setViewMode: (viewMode) => set({ viewMode }),

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    setCurrentFolder: (currentFolder) => set({ currentFolder }),

    setFileTree: (fileTree) => set({ fileTree }),

    setErrorCallback: (errorCallback) => set({ errorCallback }),

    setAutoSaveConfig: (autoSaveConfig) => set({ autoSaveConfig }),
  };
});

// Initialize first tab as active
{
  const state = useTabsStore.getState();
  if (state.tabs.length > 0 && !state.activeTabId) {
    useTabsStore.setState({ activeTabId: state.tabs[0].id });
  }
}
