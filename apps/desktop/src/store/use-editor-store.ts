import { create } from 'zustand';

export type ViewMode = 'edit' | 'preview' | 'split';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
}

type ErrorCallback = (message: string) => void;

interface EditorState {
  content: string;
  filePath: string | null;
  fileName: string;
  isDirty: boolean;
  isSaving: boolean;
  viewMode: ViewMode;
  sidebarOpen: boolean;
  sidebarWidth: number;
  currentFolder: string | null;
  fileTree: FileNode[];
  cursorLine: number;
  cursorColumn: number;
  wordCount: number;
  charCount: number;
  errorCallback: ErrorCallback | null;

  setContent: (content: string) => void;
  setFilePath: (path: string | null) => void;
  setFileName: (name: string) => void;
  setDirty: (dirty: boolean) => void;
  setSaving: (saving: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setCurrentFolder: (folder: string | null) => void;
  setFileTree: (tree: FileNode[]) => void;
  setCursorPosition: (line: number, column: number) => void;
  setErrorCallback: (callback: ErrorCallback | null) => void;

  newFile: () => void;
  openFile: (filePath: string) => Promise<void>;
  saveFile: () => Promise<void>;
  saveFileAs: () => Promise<void>;
  openFolder: (folderPath: string) => Promise<void>;
}

const DEFAULT_CONTENT = `# 欢迎使用 MarkMate

这是一个专业的 Markdown 文档编辑器。

## 开始使用

- 点击 **文件** → **打开文件** 打开一个 Markdown 文件
- 点击 **文件** → **打开文件夹** 浏览整个目录
- 使用快捷键 \`Ctrl+S\` 保存文件
- 使用 \`Ctrl+/\` 切换编辑/预览模式

## 功能特性

1. **实时预览** - 编辑时即时查看渲染效果
2. **语法高亮** - 代码块支持多语言高亮
3. **文件树** - 快速导航目录中的文件
4. **深色主题** - 护眼的 Catppuccin Mocha 配色

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

// Memory safety limits
const LARGE_FILE_WARN_BYTES = 2 * 1024 * 1024; // Warn for files > 2MB

export const useEditorStore = create<EditorState>((set, get, api) => {
  let countTimer: ReturnType<typeof setTimeout> | null = null;
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let autoSaveConfig = { enabled: true, interval: 30000 };

  function scheduleCount() {
    if (countTimer) clearTimeout(countTimer);
    countTimer = setTimeout(() => {
      const content = get().content;
      set({
        wordCount: countWords(content),
        charCount: content.length,
      });
    }, 200);
  }

  function clearAutoSaveTimer() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
      autoSaveTimer = null;
    }
  }

  function scheduleAutoSave() {
    clearAutoSaveTimer();
    const { filePath, isDirty } = get();
    if (!autoSaveConfig.enabled || !filePath || !isDirty) {
      return;
    }
    autoSaveTimer = setTimeout(async () => {
      const state = get();
      if (!state.filePath || !state.isDirty) return;

      try {
        const result = await window.markmate.fs.writeFile(state.filePath, state.content);
        if (result.success) {
          set({ isDirty: false });
        }
      } catch {
        // Silently fail - auto save errors should not interrupt user
      }
    }, autoSaveConfig.interval);
  }

  // Public method to update auto-save config (called from App when config changes)
  // NOTE: attach via the api param — referencing useEditorStore here would hit TDZ
  // because create() runs this initializer synchronously before the const is assigned.
  (api as any).updateAutoSaveConfig = (config: { enabled: boolean; interval: number }) => {
    autoSaveConfig = config;
    if (config.enabled) {
      scheduleAutoSave();
    } else {
      clearAutoSaveTimer();
    }
  };

  return {
    content: DEFAULT_CONTENT,
    filePath: null,
    fileName: '未命名.md',
    isDirty: false,
    isSaving: false,
    viewMode: 'split',
    sidebarOpen: true,
    sidebarWidth: 260,
    currentFolder: null,
    fileTree: [],
    cursorLine: 1,
    cursorColumn: 1,
    wordCount: countWords(DEFAULT_CONTENT),
    charCount: DEFAULT_CONTENT.length,
    errorCallback: null,

    setContent: (content) => {
      set({ content, isDirty: true });
      scheduleCount();
      scheduleAutoSave();
    },

    setFilePath: (filePath) => set({ filePath }),

    setFileName: (fileName) => set({ fileName }),

    setDirty: (isDirty) => set({ isDirty }),

    setSaving: (isSaving) => set({ isSaving }),

    setViewMode: (viewMode) => set({ viewMode }),

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),

    setCurrentFolder: (currentFolder) => set({ currentFolder }),

    setFileTree: (fileTree) => set({ fileTree }),

    setCursorPosition: (cursorLine, cursorColumn) => set({ cursorLine, cursorColumn }),

    setErrorCallback: (errorCallback) => set({ errorCallback }),

    newFile: () => {
      clearAutoSaveTimer();
      const content = '# 新文档\n\n开始编写...\n';
      set({
        content,
        filePath: null,
        fileName: '未命名.md',
        isDirty: false,
        wordCount: countWords(content),
        charCount: content.length,
      });
    },

    openFile: async (filePath) => {
      clearAutoSaveTimer();
      const result = await window.markmate.fs.readFile(filePath);
      if (result.success && result.content !== undefined) {
        const name = await window.markmate.path.basename(filePath);
        set({
          content: result.content,
          filePath,
          fileName: name,
          isDirty: false,
          wordCount: countWords(result.content),
          charCount: result.content.length,
        });

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
      const { content, filePath, errorCallback } = get();
      set({ isSaving: true });

      let targetPath = filePath;
      if (!targetPath) {
        targetPath = await window.markmate.dialog.saveFile('未命名.md');
        if (!targetPath) {
          set({ isSaving: false });
          return;
        }
      }

      const result = await window.markmate.fs.writeFile(targetPath, content);
      if (result.success) {
        clearAutoSaveTimer();
        const name = await window.markmate.path.basename(targetPath);
        set({
          filePath: targetPath,
          fileName: name,
          isDirty: false,
          isSaving: false,
        });
      } else {
        set({ isSaving: false });
        errorCallback?.(result.error || '保存文件失败');
      }
    },

    saveFileAs: async () => {
      const { content, filePath, errorCallback } = get();
      set({ isSaving: true });

      const defaultPath = filePath || '未命名.md';
      const targetPath = await window.markmate.dialog.saveFile(defaultPath);
      if (!targetPath) {
        set({ isSaving: false });
        return;
      }

      const result = await window.markmate.fs.writeFile(targetPath, content);
      if (result.success) {
        clearAutoSaveTimer();
        const name = await window.markmate.path.basename(targetPath);
        set({
          filePath: targetPath,
          fileName: name,
          isDirty: false,
          isSaving: false,
        });
      } else {
        set({ isSaving: false });
        errorCallback?.(result.error || '保存文件失败');
      }
    },

    openFolder: async (folderPath) => {
      // Use flat read for root level - lazy load subdirectories on expand
      const result = await window.markmate.fs.readDirectoryFlat(folderPath);
      if (result.success && result.items) {
        set({
          currentFolder: folderPath,
          fileTree: result.items,
        });
      } else {
        const errorMsg = result.error || '无法读取目录';
        get().errorCallback?.(errorMsg);
      }
    },
  };
});
