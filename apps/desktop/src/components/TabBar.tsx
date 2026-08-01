import { memo, useCallback } from 'react';
import { useTabsStore, type Tab } from '@/store/use-tabs-store';

const XIcon = memo(function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
});

const FileIcon = memo(function FileIcon({ isDirty }: { isDirty: boolean }) {
  if (isDirty) {
    return (
      <span className="w-3.5 h-3.5 rounded-full bg-yellow shrink-0" title="未保存" />
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
});

const TabItem = memo(function TabItem({
  tab,
  isActive,
  onSelect,
  onClose,
  onMiddleClick,
}: {
  tab: Tab;
  isActive: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onMiddleClick: (id: string) => void;
}) {
  const handleClick = useCallback(() => {
    onSelect(tab.id);
  }, [tab.id, onSelect]);

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(tab.id);
  }, [tab.id, onClose]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle click to close
    if (e.button === 1) {
      e.preventDefault();
      onMiddleClick(tab.id);
    }
  }, [tab.id, onMiddleClick]);

  return (
    <div
      className={`group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 text-sm border-r border-surface0 cursor-pointer select-none min-w-0 max-w-48 ${
        isActive
          ? 'bg-base text-text border-t-2 border-t-blue'
          : 'bg-mantle text-subtext0 hover:bg-surface0 border-t-2 border-t-transparent'
      }`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      title={tab.filePath || tab.fileName}
    >
      <FileIcon isDirty={tab.isDirty} />
      <span className="truncate flex-1 min-w-0">{tab.fileName}</span>
      <button
        onClick={handleClose}
        className={`w-5 h-5 flex items-center justify-center rounded transition-colors shrink-0 ${
          isActive
            ? 'text-subtext0 hover:bg-surface1 hover:text-text'
            : 'text-transparent group-hover:text-subtext0 hover:bg-surface1 hover:text-text'
        }`}
        title="关闭"
      >
        <XIcon />
      </button>
    </div>
  );
});

export function TabBar() {
  const tabs = useTabsStore((s) => s.tabs);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const setActiveTab = useTabsStore((s) => s.setActiveTab);
  const closeTab = useTabsStore((s) => s.closeTab);

  const handleNewTab = useCallback(() => {
    useTabsStore.getState().newTab('# 新文档\n\n开始编写...\n');
  }, []);

  const handleMiddleClick = useCallback((tabId: string) => {
    closeTab(tabId);
  }, [closeTab]);

  return (
    <div className="h-9 bg-mantle border-b border-surface0 flex items-stretch overflow-x-auto overflow-y-hidden shrink-0">
      <div className="flex items-stretch flex-1 min-w-0 overflow-x-auto">
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onSelect={setActiveTab}
            onClose={closeTab}
            onMiddleClick={handleMiddleClick}
          />
        ))}
      </div>

      <button
        onClick={handleNewTab}
        className="w-9 h-full flex items-center justify-center text-subtext0 hover:bg-surface0 hover:text-text transition-colors shrink-0 border-l border-surface0"
        title="新建标签页 (Ctrl+N)"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
