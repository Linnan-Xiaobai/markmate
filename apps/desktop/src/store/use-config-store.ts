import { create } from 'zustand';
import { createLogger } from '@markmate/logger';

const logger = createLogger('config-store');

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

interface ConfigState {
  config: AppConfig;
  isLoaded: boolean;
  settingsOpen: boolean;
  activeTab: string;

  loadConfig: () => Promise<void>;
  updateConfig: (partial: Partial<AppConfig>) => Promise<void>;
  resetConfig: () => Promise<void>;
  openSettings: () => void;
  closeSettings: () => void;
  setActiveTab: (tab: string) => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoaded: false,
  settingsOpen: false,
  activeTab: 'editor',

  loadConfig: async () => {
    try {
      const config = await window.markmate.config.get();
      set({ config, isLoaded: true });
    } catch (error) {
      logger.error('Failed to load config', error);
      set({ config: DEFAULT_CONFIG, isLoaded: true });
    }
  },

  updateConfig: async (partial: Partial<AppConfig>) => {
    try {
      const newConfig = await window.markmate.config.set(partial);
      set({ config: newConfig });
    } catch (error) {
      logger.error('Failed to update config', error);
    }
  },

  resetConfig: async () => {
    try {
      const newConfig = await window.markmate.config.reset();
      set({ config: newConfig });
    } catch (error) {
      logger.error('Failed to reset config', error);
    }
  },

  openSettings: () => set({ settingsOpen: true, activeTab: 'editor' }),
  closeSettings: () => set({ settingsOpen: false }),
  setActiveTab: (tab: string) => set({ activeTab: tab }),
}));

let cleanupConfigListener: (() => void) | null = null;

export function initConfigStore() {
  const { loadConfig } = useConfigStore.getState();
  loadConfig();

  if (cleanupConfigListener) {
    cleanupConfigListener();
  }

  cleanupConfigListener = window.markmate.config.onChange((config) => {
    useConfigStore.setState({ config });
  });
}

export function cleanupConfigStore() {
  if (cleanupConfigListener) {
    cleanupConfigListener();
    cleanupConfigListener = null;
  }
}
