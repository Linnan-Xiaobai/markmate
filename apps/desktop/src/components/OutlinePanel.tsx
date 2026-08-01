import { memo, useEffect, useMemo, useRef } from 'react';
import { useTabsStore } from '@/store/use-tabs-store';
import { extractHeadings } from '@/utils/extract-headings';
import { dispatchGotoHeading } from '@/hooks/use-scroll-sync';

export const OutlinePanel = memo(function OutlinePanel() {
  const activeTab = useTabsStore((s) => {
    const id = s.activeTabId;
    return id ? s.tabs.find((t) => t.id === id) : s.tabs[0];
  });
  const content = activeTab?.content ?? '';
  const cursorLine = activeTab?.cursorLine ?? 1;

  const headings = useMemo(() => extractHeadings(content), [content]);

  // Active heading: the last heading at or above the cursor line
  const activeIndex = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < headings.length; i++) {
      if (headings[i].line <= cursorLine) idx = i;
      else break;
    }
    return idx;
  }, [headings, cursorLine]);

  // Keep the active item visible inside the panel
  const activeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (headings.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-subtext0 text-sm">
        文档中没有标题
      </div>
    );
  }

  return (
    <div className="py-1">
      {headings.map((h, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={`${h.line}-${i}`}
            ref={isActive ? activeRef : undefined}
            onClick={() => dispatchGotoHeading({ line: h.line, headingIndex: i })}
            title={h.text}
            className={`w-full flex items-center gap-1.5 pr-2 py-1 text-sm rounded transition-colors text-left border-l-2 ${
              isActive
                ? 'bg-surface1 text-text border-blue'
                : 'text-subtext0 hover:bg-surface0 hover:text-text border-transparent'
            }`}
            style={{ paddingLeft: `${(h.level - 1) * 12 + 10}px` }}
          >
            <span className="truncate">{h.text}</span>
          </button>
        );
      })}
    </div>
  );
});
