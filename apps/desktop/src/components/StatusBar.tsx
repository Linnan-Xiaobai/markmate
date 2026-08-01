import { memo } from 'react';
import { useTabsStore } from '@/store/use-tabs-store';

const modeLabels: Record<string, string> = {
  edit: '编辑模式',
  split: '分屏模式',
  preview: '预览模式',
};

export const StatusBar = memo(function StatusBar() {
  const activeTab = useTabsStore((s) => {
    const id = s.activeTabId;
    return id ? s.tabs.find((t) => t.id === id) : s.tabs[0];
  });
  const viewMode = useTabsStore((s) => s.viewMode);
  const isSaving = useTabsStore((s) => s.isSaving());
  const isDirty = useTabsStore((s) => s.isDirty());

  const cursorLine = activeTab?.cursorLine ?? 1;
  const cursorColumn = activeTab?.cursorColumn ?? 1;
  const wordCount = activeTab?.wordCount ?? 0;
  const charCount = activeTab?.charCount ?? 0;

  return (
    <div className="h-6 bg-crust border-t border-surface0 flex items-center px-3 text-xs text-overlay0 select-none gap-4">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${isDirty ? 'bg-peach' : 'bg-green'}`} />
        <span>{isSaving ? '保存中...' : isDirty ? '已修改' : '已保存'}</span>
      </div>

      <div className="w-px h-3 bg-surface0" />

      <span>Ln {cursorLine}, Col {cursorColumn}</span>

      <div className="w-px h-3 bg-surface0" />

      <span>{wordCount} 词</span>

      <div className="w-px h-3 bg-surface0" />

      <span>{charCount} 字符</span>

      <div className="flex-1" />

      <span>{modeLabels[viewMode]}</span>

      <div className="w-px h-3 bg-surface0" />

      <span>Markdown</span>

      <div className="w-px h-3 bg-surface0" />

      <span>UTF-8</span>
    </div>
  );
});
