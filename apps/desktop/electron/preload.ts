import { contextBridge, ipcRenderer } from 'electron';

export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface FileReadResult {
  success: boolean;
  content?: string;
  size?: number;
  error?: string;
}

export interface FileWriteResult {
  success: boolean;
  error?: string;
}

export interface DirectoryReadResult {
  success: boolean;
  items?: FileItem[];
  truncated?: boolean;
  error?: string;
}

interface MemoryInfo {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
}

interface MemoryPressureInfo {
  heapUsed: number;
  heapTotal: number;
  rss: number;
}

export interface AppConfig {
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

const markmateAPI = {
  dialog: {
    openFile: (): Promise<string | null> => ipcRenderer.invoke('dialog:open-file'),
    openFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:open-folder'),
    saveFile: (defaultPath?: string): Promise<string | null> =>
      ipcRenderer.invoke('dialog:save-file', defaultPath),
  },
  fs: {
    readFile: (filePath: string): Promise<FileReadResult> =>
      ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath: string, content: string): Promise<FileWriteResult> =>
      ipcRenderer.invoke('fs:write-file', filePath, content),
    readDirectory: (dirPath: string): Promise<DirectoryReadResult> =>
      ipcRenderer.invoke('fs:read-directory', dirPath),
    readDirectoryFlat: (dirPath: string): Promise<DirectoryReadResult> =>
      ipcRenderer.invoke('fs:read-directory-flat', dirPath),
  },
  app: {
    getTheme: (): Promise<'light' | 'dark'> => ipcRenderer.invoke('app:get-theme'),
    setTheme: (theme: 'light' | 'dark' | 'system'): Promise<'light' | 'dark'> =>
      ipcRenderer.invoke('app:set-theme', theme),
    getMemoryInfo: (): Promise<MemoryInfo> => ipcRenderer.invoke('app:get-memory-info'),
    triggerGC: (): Promise<void> => ipcRenderer.invoke('app:trigger-gc'),
    onMemoryPressure: (callback: (info: MemoryPressureInfo) => void) => {
      const listener = (_: unknown, info: MemoryPressureInfo) => callback(info);
      ipcRenderer.on('app:memory-pressure', listener);
      return () => ipcRenderer.removeListener('app:memory-pressure', listener);
    },
    notifySavedForClose: () => ipcRenderer.send('app:saved-for-close'),
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('window:maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
    onMaximizedChange: (callback: (isMaximized: boolean) => void) => {
      const listener = (_: unknown, isMaximized: boolean) => callback(isMaximized);
      ipcRenderer.on('window:maximized-changed', listener);
      return () => ipcRenderer.removeListener('window:maximized-changed', listener);
    },
  },
  path: {
    basename: (filePath: string): Promise<string> => ipcRenderer.invoke('path:basename', filePath),
    dirname: (filePath: string): Promise<string> => ipcRenderer.invoke('path:dirname', filePath),
    join: (...paths: string[]): Promise<string> => ipcRenderer.invoke('path:join', ...paths),
  },
  config: {
    get: (): Promise<AppConfig> => ipcRenderer.invoke('config:get'),
    set: (config: Partial<AppConfig>): Promise<AppConfig> => ipcRenderer.invoke('config:set', config),
    reset: (): Promise<AppConfig> => ipcRenderer.invoke('config:reset'),
    onChange: (callback: (config: AppConfig) => void) => {
      const listener = (_: unknown, config: AppConfig) => callback(config);
      ipcRenderer.on('config:changed', listener);
      return () => ipcRenderer.removeListener('config:changed', listener);
    },
  },
  on: {
    fileOpen: (callback: (filePath: string) => void) => {
      const listener = (_: unknown, filePath: string) => callback(filePath);
      ipcRenderer.on('file:open', listener);
      return () => ipcRenderer.removeListener('file:open', listener);
    },
    folderOpen: (callback: (folderPath: string) => void) => {
      const listener = (_: unknown, folderPath: string) => callback(folderPath);
      ipcRenderer.on('folder:open', listener);
      return () => ipcRenderer.removeListener('folder:open', listener);
    },
    fileSave: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('file:save', listener);
      return () => ipcRenderer.removeListener('file:save', listener);
    },
    fileSaveAs: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('file:save-as', listener);
      return () => ipcRenderer.removeListener('file:save-as', listener);
    },
  },
};

contextBridge.exposeInMainWorld('markmate', markmateAPI);

export type MarkmateAPI = typeof markmateAPI;
