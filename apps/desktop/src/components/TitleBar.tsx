import { useState, useEffect, useCallback, memo } from 'react';
import { useTabsStore } from '@/store/use-tabs-store';

const MinimizeIcon = memo(function MinimizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <rect y="5.5" width="12" height="1" />
    </svg>
  );
});

const MaximizeIcon = memo(function MaximizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="0.5" y="0.5" width="11" height="11" />
    </svg>
  );
});

const RestoreIcon = memo(function RestoreIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="2.5" y="0.5" width="9" height="9" />
      <rect x="0.5" y="2.5" width="9" height="9" fill="#181825" />
    </svg>
  );
});

const CloseIcon = memo(function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
      <line x1="1" y1="1" x2="11" y2="11" />
      <line x1="11" y1="1" x2="1" y2="11" />
    </svg>
  );
});

export function TitleBar() {
  const fileName = useTabsStore((s) => {
    const id = s.activeTabId;
    const tab = id ? s.tabs.find((t) => t.id === id) : s.tabs[0];
    return tab?.fileName ?? '未命名.md';
  });
  const isDirty = useTabsStore((s) => s.isDirty());
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.markmate.window.isMaximized().then(setIsMaximized);
    const unsub = window.markmate.window.onMaximizedChange(setIsMaximized);
    return unsub;
  }, []);

  const handleMinimize = useCallback(() => window.markmate.window.minimize(), []);
  const handleMaximize = useCallback(async () => {
    await window.markmate.window.maximize();
  }, []);
  const handleClose = useCallback(() => window.markmate.window.close(), []);

  return (
    <div className="titlebar-drag h-9 bg-mantle flex items-center justify-between select-none border-b border-surface0">
      <div className="flex items-center px-3 gap-2">
        <div className="w-5 h-5 rounded bg-gradient-to-br from-blue to-lavender flex items-center justify-center">
          <span className="text-xs font-bold text-mantle">M</span>
        </div>
        <span className="text-sm text-subtext0 font-medium">MarkMate</span>
        <span className="text-surface2">—</span>
        <span className="text-sm text-text">
          {fileName}
          {isDirty && <span className="text-peach ml-1">●</span>}
        </span>
      </div>
      <div className="titlebar-no-drag flex items-center h-full">
        <button
          onClick={handleMinimize}
          className="w-11 h-full flex items-center justify-center text-subtext0 hover:bg-surface0 transition-colors"
          title="最小化"
        >
          <MinimizeIcon />
        </button>
        <button
          onClick={handleMaximize}
          className="w-11 h-full flex items-center justify-center text-subtext0 hover:bg-surface0 transition-colors"
          title={isMaximized ? '还原' : '最大化'}
        >
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          onClick={handleClose}
          className="w-11 h-full flex items-center justify-center text-subtext0 hover:bg-red hover:text-mantle transition-colors"
          title="关闭"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
}
