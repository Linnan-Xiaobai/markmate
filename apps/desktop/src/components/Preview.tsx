import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import markedKatex from 'marked-katex-extension';
import 'katex/dist/katex.min.css';
import { useTabsStore } from '@/store/use-tabs-store';
import { useScrollSync, GOTO_HEADING_EVENT } from '@/hooks/use-scroll-sync';
import type { GotoHeadingDetail } from '@/hooks/use-scroll-sync';

const renderer = new marked.Renderer();
const originalLinkRenderer = renderer.link.bind(renderer);

// Sequential heading ids (md-h-N) for outline navigation.
// Order matches extractHeadings() output (both follow marked's parse order).
let headingIndex = 0;

renderer.heading = (text, level) => {
  const id = `md-h-${headingIndex++}`;
  return `<h${level} id="${id}">${text}</h${level}>\n`;
};

renderer.link = (href, title, text) => {
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));
  const html = originalLinkRenderer(href, title, text);
  if (isExternal) {
    return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
  }
  return html;
};

// Code block renderer with syntax highlighting
renderer.code = (code, language) => {
  let highlighted: string;
  let detectedLang = language || '';

  if (language && hljs.getLanguage(language)) {
    try {
      highlighted = hljs.highlight(code, { language }).value;
    } catch {
      highlighted = hljs.highlightAuto(code).value;
      detectedLang = 'auto';
    }
  } else if (!language) {
    highlighted = hljs.highlightAuto(code).value;
    detectedLang = 'auto';
  } else {
    // Unsupported language, escape and wrap
    highlighted = escapeHtml(code);
  }

  const langClass = detectedLang && detectedLang !== 'auto' ? `data-lang="${detectedLang}"` : '';
  return `<pre class="hljs-code-block"><code class="hljs language-${language || 'auto'}" ${langClass}>${highlighted}</code></pre>`;
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

marked.setOptions({
  gfm: true,
  breaks: false,
  renderer,
  // Performance: limit depth to prevent stack overflow on deeply nested content
});

// KaTeX math support: inline $...$ and block $$...$$
// throwOnError: false renders invalid formulas as red source text instead of throwing
marked.use(markedKatex({ throwOnError: false }));

// Rendering tuning based on content size
const SMALL_CONTENT_MS = 80;
const LARGE_CONTENT_MS = 300;
const LARGE_CONTENT_THRESHOLD = 200 * 1024; // 200KB - longer debounce

// Shared marked parser worker pattern not used (keep on main thread for simplicity)
// KaTeX emits MathML + HTML (with inline style for sizing) and occasional SVG,
// so enable all three profiles and allow the extra attributes it relies on.
const DOMPURIFY_CONFIG = {
  USE_PROFILES: { html: true, mathMl: true, svg: true },
  ADD_TAGS: ['input'],
  ADD_ATTR: ['checked', 'type', 'disabled', 'rel', 'target', 'data-lang', 'style', 'encoding', 'mathvariant', 'displaystyle', 'xmlns'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed'],
};

export const Preview = memo(function Preview() {
  const activeTab = useTabsStore((s) => {
    const id = s.activeTabId;
    return id ? s.tabs.find((t) => t.id === id) : s.tabs[0];
  });
  const content = activeTab?.content ?? '';

  const containerRef = useRef<HTMLDivElement>(null);
  const renderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleCallbackRef = useRef<number | null>(null);
  const [html, setHtml] = useState('');
  const [largeFile, setLargeFile] = useState(false);

  // Get scroll container for scroll sync
  const getScrollElement = useCallback(() => {
    return containerRef.current;
  }, []);

  // Enable scroll sync in split mode
  useScrollSync(getScrollElement, 'preview');

  const renderMarkdown = useCallback((text: string) => {
    const contentLength = text.length;
    const isLarge = contentLength > LARGE_CONTENT_THRESHOLD;
    setLargeFile(isLarge);

    try {
      // For large content, only render first N chars to preview, or render progressively
      const renderText = isLarge ? text.slice(0, 80000) + '\n\n\n> ⚠️ 文件较大，仅预览前 80KB 内容...' : text;
      headingIndex = 0; // reset per parse so ids align with extractHeadings order
      const rawHtml = marked.parse(renderText) as string;
      const clean = DOMPurify.sanitize(rawHtml, DOMPURIFY_CONFIG);
      setHtml(clean);
    } catch {
      setHtml('<p style="color: #f38ba8;">渲染出错，请检查文件格式</p>');
    }
  }, []);

  // Schedule render with adaptive debounce + requestIdleCallback
  const scheduleRender = useCallback((text: string) => {
    // Clear pending timers
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    if (idleCallbackRef.current !== null) {
      cancelIdleCallback(idleCallbackRef.current);
      idleCallbackRef.current = null;
    }

    const isLarge = text.length > LARGE_CONTENT_THRESHOLD;
    const delay = isLarge ? LARGE_CONTENT_MS : SMALL_CONTENT_MS;

    renderTimerRef.current = setTimeout(() => {
      // Use requestIdleCallback if available to render during browser idle time
      if (typeof requestIdleCallback !== 'undefined') {
        idleCallbackRef.current = requestIdleCallback(() => {
          renderMarkdown(text);
          idleCallbackRef.current = null;
        }, { timeout: isLarge ? 2000 : 500 });
      } else {
        renderMarkdown(text);
      }
    }, delay);
  }, [renderMarkdown]);

  useEffect(() => {
    scheduleRender(content);
    return () => {
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
      if (idleCallbackRef.current !== null) {
        cancelIdleCallback(idleCallbackRef.current);
      }
    };
  }, [content, scheduleRender]);

  // Initial render
  useEffect(() => {
    renderMarkdown(content);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outline navigation: scroll to heading by index (md-h-N)
  useEffect(() => {
    const handler = (e: Event) => {
      const { headingIndex: idx } = (e as CustomEvent<GotoHeadingDetail>).detail;
      const scrollTo = (): boolean => {
        const el = containerRef.current?.querySelector(`#md-h-${idx}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return !!el;
      };
      // Preview may still be debounce-rendering; retry once if missing
      if (!scrollTo()) {
        setTimeout(scrollTo, 200);
      }
    };
    window.addEventListener(GOTO_HEADING_EVENT, handler);
    return () => window.removeEventListener(GOTO_HEADING_EVENT, handler);
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full overflow-y-auto bg-base relative">
      {largeFile && (
        <div className="sticky top-0 z-10 px-4 py-1 text-xs text-yellow bg-surface0 border-b border-surface1">
          ⚠️ 大文件模式 - 已限制预览范围以节省内存
        </div>
      )}
      <div
        className="markdown-preview"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
});
