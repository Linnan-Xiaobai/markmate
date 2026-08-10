import { memo, useCallback } from 'react';
import { useTabsStore, type ViewMode } from '@/store/use-tabs-store';
import { useConfigStore } from '@/store/use-config-store';

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const NewFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="12" y1="18" x2="12" y2="12" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
);

const OpenFileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M9 15l2 2 4-4" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const SidebarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SplitIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);

const PreviewIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

interface ModeConfig {
  mode: ViewMode;
  label: string;
  icon: React.ReactNode;
}

const viewModes: ModeConfig[] = [
  { mode: 'edit', label: '编辑', icon: <EditIcon /> },
  { mode: 'split', label: '分屏', icon: <SplitIcon /> },
  { mode: 'preview', label: '预览', icon: <PreviewIcon /> },
];

const ViewModeButton = memo(function ViewModeButton({
  mode,
  label,
  icon,
  isActive,
  onClick,
}: ModeConfig & { isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium transition-colors ${
        isActive
          ? 'bg-surface1 text-text shadow-sm'
          : 'text-subtext0 hover:text-text'
      }`}
      title={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
});

export function Toolbar() {
  const viewMode = useTabsStore((s) => s.viewMode);
  const setViewMode = useTabsStore((s) => s.setViewMode);
  const toggleSidebar = useTabsStore((s) => s.toggleSidebar);
  const saveFile = useTabsStore((s) => s.saveFile);
  const openFile = useTabsStore((s) => s.openFile);
  const sidebarOpen = useTabsStore((s) => s.sidebarOpen);
  const openSettings = useConfigStore((s) => s.openSettings);

  const handleNewFile = useCallback(() => {
    useTabsStore.getState().newTab('# 新文档\n\n开始编写...\n');
  }, []);

  const handleOpenFile = useCallback(async () => {
    const filePath = await window.markmate.dialog.openFile();
    if (filePath) {
      openFile(filePath);
    }
  }, [openFile]);

  const handleMenuClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    window.markmate.app.popupMenu(rect.left, rect.bottom + 4);
  }, []);

  return (
    <div className="h-10 bg-mantle border-b border-surface0 flex items-center px-2 gap-1">
      <button
        onClick={handleMenuClick}
        className="w-8 h-8 flex items-center justify-center rounded text-subtext0 hover:bg-surface0 hover:text-text transition-colors"
        title="菜单"
      >
        <MenuIcon />
      </button>

      <div className="w-px h-5 bg-surface0 mx-0.5" />

      <button
        onClick={handleNewFile}
        className="w-8 h-8 flex items-center justify-center rounded text-subtext0 hover:bg-surface0 hover:text-text transition-colors"
        title="新建文件 (Ctrl+N)"
      >
        <NewFileIcon />
      </button>

      <button
        onClick={handleOpenFile}
        className="w-8 h-8 flex items-center justify-center rounded text-subtext0 hover:bg-surface0 hover:text-text transition-colors"
        title="打开文件 (Ctrl+O)"
      >
        <OpenFileIcon />
      </button>

      <button
        onClick={saveFile}
        className="w-8 h-8 flex items-center justify-center rounded text-subtext0 hover:bg-surface0 hover:text-text transition-colors"
        title="保存 (Ctrl+S)"
      >
        <SaveIcon />
      </button>

      <div className="w-px h-5 bg-surface0 mx-1" />

      <button
        onClick={toggleSidebar}
        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
          sidebarOpen ? 'bg-surface0 text-blue' : 'text-subtext0 hover:bg-surface0 hover:text-text'
        }`}
        title="切换侧边栏 (Ctrl+B)"
      >
        <SidebarIcon />
      </button>

      <div className="w-px h-5 bg-surface0 mx-1" />

      <div className="flex items-center bg-surface0 rounded-md p-0.5">
        {viewModes.map((m) => (
          <ViewModeButton
            key={m.mode}
            mode={m.mode}
            label={m.label}
            icon={m.icon}
            isActive={viewMode === m.mode}
            onClick={() => setViewMode(m.mode)}
          />
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={openSettings}
        className="w-8 h-8 flex items-center justify-center rounded text-subtext0 hover:bg-surface0 hover:text-text transition-colors"
        title="设置 (Ctrl+,)"
      >
        <SettingsIcon />
      </button>
    </div>
  );
}
