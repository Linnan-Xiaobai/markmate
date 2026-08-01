import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/globals.css';

// Browser mock for development preview (Electron preload injects real API in production)
if (typeof window !== 'undefined' && !window.markmate) {
  window.markmate = {
    dialog: {
      openFile: async () => null,
      openFolder: async () => null,
      saveFile: async () => null,
    },
    fs: {
      readFile: async () => ({ success: false, error: 'Browser preview mode' }),
      writeFile: async () => ({ success: false, error: 'Browser preview mode' }),
      readDirectory: async () => ({ success: false, error: 'Browser preview mode' }),
      readDirectoryFlat: async () => ({ success: false, error: 'Browser preview mode' }),
    },
    app: {
      getTheme: async () => 'dark',
      setTheme: async () => 'dark',
      getMemoryInfo: async () => ({ heapUsed: 0, heapTotal: 0, rss: 0, external: 0 }),
      triggerGC: async () => {},
      onMemoryPressure: () => () => {},
      notifySavedForClose: () => {},
    },
    window: {
      minimize: async () => {},
      maximize: async () => {},
      close: async () => {},
      isMaximized: async () => false,
      onMaximizedChange: () => () => {},
    },
    path: {
      basename: async (p: string) => p.split(/[/\\]/).pop() || p,
      dirname: async (p: string) => p.split(/[/\\]/).slice(0, -1).join('/') || '.',
      join: async (...paths: string[]) => paths.join('/'),
    },
    config: {
      get: async () => ({
        theme: 'dark' as const,
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
      }),
      set: async (config: Partial<AppConfig>) => ({
        theme: 'dark' as const,
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
        ...config,
      }),
      reset: async () => ({
        theme: 'dark' as const,
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
      }),
      onChange: () => () => {},
    },
    on: {
      fileOpen: () => () => {},
      folderOpen: () => () => {},
      fileSave: () => () => {},
      fileSaveAs: () => () => {},
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
