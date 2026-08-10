import { useEffect, useRef, useState, useCallback, memo } from 'react';
import mermaid from 'mermaid';
import { createRoot } from 'react-dom/client';

interface MermaidDiagramProps {
  code: string;
  id: string;
}

export const MermaidDiagram = memo(function MermaidDiagram({ code, id }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const renderIdRef = useRef(0);

  const getMermaidTheme = useCallback((): 'dark' | 'default' => {
    const dataTheme = document.documentElement.getAttribute('data-theme');
    return dataTheme === 'light' ? 'default' : 'dark';
  }, []);

  const renderDiagram = useCallback(async () => {
    if (!svgContainerRef.current) return;

    const currentRenderId = ++renderIdRef.current;

    try {
      const theme = getMermaidTheme();
      mermaid.initialize({
        startOnLoad: false,
        theme,
        securityLevel: 'strict',
        fontFamily: 'inherit',
      });

      const renderId = `${id}-svg-${currentRenderId}`;
      const { svg } = await mermaid.render(renderId, code);

      if (currentRenderId === renderIdRef.current && svgContainerRef.current) {
        svgContainerRef.current.innerHTML = svg;
        setError(null);
      }
    } catch (err) {
      if (currentRenderId === renderIdRef.current) {
        const errorMsg = err instanceof Error ? err.message : '图表语法错误';
        setError(errorMsg);
      }
    }
  }, [code, id, getMermaidTheme]);

  useEffect(() => {
    renderDiagram();

    const observer = new MutationObserver(() => {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      renderDiagram();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, [renderDiagram]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.1, 3));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.1, 0.3));
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((f) => !f);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.min(Math.max(s + delta, 0.3), 3));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const el = svgContainerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
      return () => el.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const containerClass = isFullscreen
    ? 'mermaid-diagram-container mermaid-fullscreen'
    : 'mermaid-diagram-container';

  return (
    <div ref={containerRef} className={containerClass}>
      <div className="mermaid-toolbar">
        <div className="mermaid-toolbar-left">
          <span className="mermaid-lang-label">
            mermaid
            <svg className="mermaid-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        <div className="mermaid-toolbar-right">
          <button
            className="mermaid-toolbar-btn"
            onClick={copyCode}
            title={copied ? '已复制!' : '复制代码'}
          >
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.3 3.3L6 10.6L2.7 7.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5.5" y="5.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M3.5 10.5V3.5C3.5 2.9 3.9 2.5 4.5 2.5H10.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div
        className={`mermaid-svg-container ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      >
        {error ? (
          <div className="mermaid-error-display">
            <div className="mermaid-error-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 7V13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            </div>
            <div className="mermaid-error-title">Mermaid 渲染错误</div>
            <div className="mermaid-error-message">{error}</div>
            <pre className="mermaid-error-code">{code}</pre>
          </div>
        ) : (
          <div
            ref={svgContainerRef}
            className="mermaid-svg-content"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          />
        )}
      </div>

      {!error && (
        <div className="mermaid-zoom-controls">
          <button className="mermaid-zoom-btn" onClick={zoomOut} title="缩小">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M5 7H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
          <span className="mermaid-zoom-level">{Math.round(scale * 100)}%</span>
          <button className="mermaid-zoom-btn" onClick={zoomIn} title="放大">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M7 5V9M5 7H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="mermaid-zoom-divider" />
          <button className="mermaid-zoom-btn" onClick={resetZoom} title="重置">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8C3 5.2 5.2 3 8 3C9.6 3 11 3.8 11.8 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M12 3V5.5H9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 8C13 10.8 10.8 13 8 13C6.4 13 5 12.2 4.2 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M4 13V10.5H6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="mermaid-zoom-btn" onClick={toggleFullscreen} title={isFullscreen ? '退出全屏' : '全屏'}>
            {isFullscreen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3V5.5C6 5.8 5.8 6 5.5 6H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 3V5.5C10 5.8 10.2 6 10.5 6H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 13V10.5C6 10.2 5.8 10 5.5 10H3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 13V10.5C10 10.2 10.2 10 10.5 10H13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 6V3.5C3 3.2 3.2 3 3.5 3H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 3H12.5C12.8 3 13 3.2 13 3.5V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 10V12.5C3 12.8 3.2 13 3.5 13H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 13H12.5C12.8 13 13 12.8 13 12.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

export function mountMermaidDiagrams(container: HTMLElement) {
  const diagramPlaceholders = container.querySelectorAll('.mermaid-diagram-placeholder');
  diagramPlaceholders.forEach((placeholder) => {
    const el = placeholder as HTMLElement;
    const id = el.id;
    const code = decodeURIComponent(el.getAttribute('data-mermaid-code') || '');

    if (!code || el.dataset.mounted === 'true') return;

    el.innerHTML = '';
    el.classList.remove('mermaid-diagram-placeholder');
    el.classList.add('mermaid-diagram-wrapper');
    el.dataset.mounted = 'true';

    const root = createRoot(el);
    root.render(<MermaidDiagram code={code} id={id} />);
  });
}
