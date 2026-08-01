export {};

declare global {
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

  interface IdleDeadline {
    didTimeout: boolean;
    timeRemaining: () => number;
  }

  function requestIdleCallback(callback: (deadline: IdleDeadline) => void, options?: { timeout?: number }): number;
  function cancelIdleCallback(handle: number): void;

  interface Window {
    markmate: {
      dialog: {
        openFile: () => Promise<string | null>;
        openFolder: () => Promise<string | null>;
        saveFile: (defaultPath?: string) => Promise<string | null>;
      };
      fs: {
        readFile: (filePath: string) => Promise<{
          success: boolean;
          content?: string;
          size?: number;
          error?: string;
        }>;
        writeFile: (filePath: string, content: string) => Promise<{
          success: boolean;
          error?: string;
        }>;
        readDirectory: (dirPath: string) => Promise<{
          success: boolean;
          items?: { name: string; path: string; isDirectory: boolean }[];
          truncated?: boolean;
          error?: string;
        }>;
        readDirectoryFlat: (dirPath: string) => Promise<{
          success: boolean;
          items?: { name: string; path: string; isDirectory: boolean }[];
          error?: string;
        }>;
      };
      app: {
        getTheme: () => Promise<'light' | 'dark'>;
        setTheme: (theme: 'light' | 'dark' | 'system') => Promise<'light' | 'dark'>;
        getMemoryInfo: () => Promise<{
          heapUsed: number;
          heapTotal: number;
          rss: number;
          external: number;
        }>;
        triggerGC: () => Promise<void>;
        onMemoryPressure: (callback: (info: { heapUsed: number; heapTotal: number; rss: number }) => void) => () => void;
        notifySavedForClose: () => void;
      };
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
        onMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void;
      };
      path: {
        basename: (filePath: string) => Promise<string>;
        dirname: (filePath: string) => Promise<string>;
        join: (...paths: string[]) => Promise<string>;
      };
      config: {
        get: () => Promise<AppConfig>;
        set: (config: Partial<AppConfig>) => Promise<AppConfig>;
        reset: () => Promise<AppConfig>;
        onChange: (callback: (config: AppConfig) => void) => () => void;
      };
      on: {
        fileOpen: (callback: (filePath: string) => void) => () => void;
        folderOpen: (callback: (folderPath: string) => void) => () => void;
        fileSave: (callback: () => void) => () => void;
        fileSaveAs: (callback: () => void) => () => void;
      };
    };
  }
}
