import { useEffect, useRef } from 'react';
import { TitleBar } from '@/components/TitleBar';
import { Toolbar } from '@/components/Toolbar';
import { Sidebar } from '@/components/Sidebar';
import { TabBar } from '@/components/TabBar';
import { Editor } from '@/components/Editor';
import { Preview } from '@/components/Preview';
import { StatusBar } from '@/components/StatusBar';
import { SettingsModal } from '@/components/SettingsModal';
import { ToastProvider, useToast } from '@/components/Toast';
import { MemoryMonitor } from '@/components/MemoryMonitor';
import { useTabsStore } from '@/store/use-tabs-store';
import { useConfigStore, initConfigStore, cleanupConfigStore } from '@/store/use-config-store';
import { useTheme } from '@/hooks/use-theme';

function AppContent() {
  const viewMode = useTabsStore((s) => s.viewMode);
  const isDirty = useTabsStore((s) => s.isDirty());
  const isSaving = useTabsStore((s) => s.isSaving());
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const openFile = useTabsStore((s) => s.openFile);
  const openFolder = useTabsStore((s) => s.setCurrentFolder);
  const setFileTree = useTabsStore((s) => s.setFileTree);
  const saveFile = useTabsStore((s) => s.saveFile);
  const saveFileAs = useTabsStore((s) => s.saveFileAs);
  const newTab = useTabsStore((s) => s.newTab);
  const closeActiveTab = useTabsStore((s) => s.closeActiveTab);
  const toggleSidebar = useTabsStore((s) => s.toggleSidebar);
  const setErrorCallback = useTabsStore((s) => s.setErrorCallback);
  const setAutoSaveConfig = useTabsStore((s) => s.setAutoSaveConfig);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const openSettings = useConfigStore((s) => s.openSettings);
  const config = useConfigStore((s) => s.config);
  const isConfigLoaded = useConfigStore((s) => s.isLoaded);
  const { showToast } = useToast();

  const isSavingRef = useRef(isSaving);
  const prevIsSavingRef = useRef(isSaving);

  // Apply theme
  useTheme();

  useEffect(() => {
    prevIsSavingRef.current = isSavingRef.current;
    isSavingRef.current = isSaving;

    // Detect save completion
    if (prevIsSavingRef.current && !isSaving) {
      window.markmate.app.notifySavedForClose();
    }
  }, [isSaving]);

  useEffect(() => {
    initConfigStore();
    return () => cleanupConfigStore();
  }, []);

  // Sync auto-save config to tabs store
  useEffect(() => {
    if (!isConfigLoaded) return;
    setAutoSaveConfig(config.autoSave);
  }, [config.autoSave, isConfigLoaded, setAutoSaveConfig]);

  useEffect(() => {
    setErrorCallback((message) => {
      showToast(message, 'error');
    });
    return () => setErrorCallback(null);
  }, [setErrorCallback, showToast]);

  // Sync dirty flag to window for main process close check
  useEffect(() => {
    const anyDirty = tabs.some((t) => t.isDirty);
    (window as any).__MARKMATE_DIRTY__ = anyDirty;
  }, [tabs]);

  // Load folder contents when currentFolder changes
  useEffect(() => {
    const folder = useTabsStore.getState().currentFolder;
    if (!folder) return;

    const loadFolder = async () => {
      const result = await window.markmate.fs.readDirectoryFlat(folder);
      if (result.success && result.items) {
        setFileTree(result.items);
      } else {
        const errorMsg = result.error || '无法读取目录';
        useTabsStore.getState().errorCallback?.(errorMsg);
      }
    };
    loadFolder();
  }, [useTabsStore((s) => s.currentFolder), setFileTree]);

  // Keyboard shortcuts and IPC listeners
  useEffect(() => {
    const handleFileOpen = (filePath: string) => {
      openFile(filePath);
    };

    const handleFolderOpen = (folderPath: string) => {
      openFolder(folderPath);
    };

    const handleFileNew = () => {
      newTab('# 新文档\n\n开始编写...\n');
    };

    const handleFileSave = () => {
      saveFile();
    };

    const handleFileSaveAs = () => {
      saveFileAs();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: New tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        newTab('# 新文档\n\n开始编写...\n');
      }

      // Ctrl+O: Open file
      if ((e.ctrlKey || e.metaKey) && e.key === 'o' && !e.shiftKey) {
        e.preventDefault();
        window.markmate.dialog.openFile().then((filePath) => {
          if (filePath) openFile(filePath);
        });
      }

      // Ctrl+Shift+O: Open folder
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'O' || e.key === 'o')) {
        e.preventDefault();
        window.markmate.dialog.openFolder().then((folderPath) => {
          if (folderPath) openFolder(folderPath);
        });
      }

      // Ctrl+W: Close active tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        closeActiveTab();
      }

      // Ctrl+Tab / Ctrl+Shift+Tab: Switch tabs
      if ((e.ctrlKey || e.metaKey) && e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = tabs.findIndex((t) => t.id === activeTabId);
        let nextIndex: number;
        if (e.shiftKey) {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }
        const nextTab = tabs[nextIndex];
        if (nextTab) setActiveTab(nextTab.id);
      }

      // Ctrl+B: Toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      // Ctrl+,: Open settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        openSettings();
      }
    };

    const unsubFileOpen = window.markmate.on.fileOpen(handleFileOpen);
    const unsubFolderOpen = window.markmate.on.folderOpen(handleFolderOpen);
    const unsubFileNew = window.markmate.on.fileNew(handleFileNew);
    const unsubSave = window.markmate.on.fileSave(handleFileSave);
    const unsubSaveAs = window.markmate.on.fileSaveAs(handleFileSaveAs);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubFileOpen();
      unsubFolderOpen();
      unsubFileNew();
      unsubSave();
      unsubSaveAs();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tabs, activeTabId, openFile, openFolder, saveFile, saveFileAs, newTab, closeActiveTab, toggleSidebar, openSettings, setActiveTab]);

  const showEditor = viewMode === 'edit' || viewMode === 'split';
  const showPreview = viewMode === 'preview' || viewMode === 'split';

  return (
    <div className="h-screen w-screen flex flex-col bg-base text-text overflow-hidden">
      <TitleBar />
      <Toolbar />
      <TabBar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex overflow-hidden">
          {showEditor && (
            <div className={`h-full overflow-hidden ${showPreview ? 'w-1/2 border-r border-surface0' : 'w-full'}`}>
              <Editor />
            </div>
          )}
          {showPreview && (
            <div className={`h-full overflow-hidden ${showEditor ? 'w-1/2' : 'w-full'}`}>
              <Preview />
            </div>
          )}
        </div>
      </div>
      <StatusBar />
      <SettingsModal />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MemoryMonitor />
      <AppContent />
    </ToastProvider>
  );
}
