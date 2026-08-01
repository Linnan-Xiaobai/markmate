import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/store/use-editor-store';

// Custom event names for scroll sync
export const EDITOR_SCROLL_EVENT = 'markmate:editor-scroll';
export const PREVIEW_SCROLL_EVENT = 'markmate:preview-scroll';
export const GOTO_HEADING_EVENT = 'markmate:goto-heading';

export interface GotoHeadingDetail {
  line: number; // 1-based source line (editor target)
  headingIndex: number; // index into rendered headings (preview target, md-h-N)
}

export function dispatchGotoHeading(detail: GotoHeadingDetail) {
  window.dispatchEvent(new CustomEvent(GOTO_HEADING_EVENT, { detail }));
}

interface ScrollSyncDetail {
  source: 'editor' | 'preview';
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  percentage: number;
}

export function dispatchEditorScroll(detail: Omit<ScrollSyncDetail, 'source'>) {
  window.dispatchEvent(
    new CustomEvent(EDITOR_SCROLL_EVENT, {
      detail: { ...detail, source: 'editor' } as ScrollSyncDetail,
    })
  );
}

export function dispatchPreviewScroll(detail: Omit<ScrollSyncDetail, 'source'>) {
  window.dispatchEvent(
    new CustomEvent(PREVIEW_SCROLL_EVENT, {
      detail: { ...detail, source: 'preview' } as ScrollSyncDetail,
    })
  );
}

export function useScrollSync(
  getScrollElement: () => HTMLElement | null,
  source: 'editor' | 'preview'
) {
  const viewMode = useEditorStore((s) => s.viewMode);
  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(
    (e: Event) => {
      if (viewMode !== 'split' || isSyncingRef.current) return;

      const el = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const maxScroll = scrollHeight - clientHeight;
      const percentage = maxScroll > 0 ? scrollTop / maxScroll : 0;

      if (source === 'editor') {
        dispatchEditorScroll({ scrollTop, scrollHeight, clientHeight, percentage });
      } else {
        dispatchPreviewScroll({ scrollTop, scrollHeight, clientHeight, percentage });
      }
    },
    [viewMode, source]
  );

  const handleSyncScroll = useCallback(
    (e: CustomEvent<ScrollSyncDetail>) => {
      if (viewMode !== 'split') return;
      const { percentage, source: eventSource } = e.detail;
      if (eventSource === source) return; // Ignore our own events

      const el = getScrollElement();
      if (!el) return;

      // Set syncing flag to prevent feedback loop
      isSyncingRef.current = true;
      const maxScroll = el.scrollHeight - el.clientHeight;
      el.scrollTop = maxScroll * percentage;

      // Reset flag after a short delay
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    },
    [viewMode, source, getScrollElement]
  );

  useEffect(() => {
    const el = getScrollElement();
    if (!el || viewMode !== 'split') return;

    // Listen to own scroll events
    el.addEventListener('scroll', handleScroll, { passive: true });

    // Listen to other pane's scroll events
    const otherEvent = source === 'editor' ? PREVIEW_SCROLL_EVENT : EDITOR_SCROLL_EVENT;
    const handler = (e: Event) => handleSyncScroll(e as CustomEvent<ScrollSyncDetail>);
    window.addEventListener(otherEvent, handler);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      window.removeEventListener(otherEvent, handler);
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [viewMode, source, getScrollElement, handleScroll, handleSyncScroll]);
}
