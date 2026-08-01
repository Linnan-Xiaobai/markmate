import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createParser } from '@markmate/core';
import type { RenderOptions } from '@markmate/core';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  options?: RenderOptions;
  onRender?: (html: string) => void;
  onHeadingClick?: (id: string, element: HTMLElement) => void;
}

const parser = createParser();

function useDeepCompareMemo<T>(value: T): T {
  const ref = useRef(value);
  const depsString = JSON.stringify(value);
  const prevDepsString = useRef(depsString);

  if (depsString !== prevDepsString.current) {
    ref.current = value;
    prevDepsString.current = depsString;
  }

  return ref.current;
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  className,
  options,
  onRender,
  onHeadingClick,
}: MarkdownRendererProps) {
  const [html, setHtml] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onRenderRef = useRef(onRender);

  useEffect(() => {
    onRenderRef.current = onRender;
  }, [onRender]);

  const stableOptions = useDeepCompareMemo(options);

  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    let cancelled = false;

    renderTimeoutRef.current = setTimeout(async () => {
      const rendered = await parser.toHTML(content, stableOptions);
      if (!cancelled) {
        setHtml(rendered);
        onRenderRef.current?.(rendered);
      }
    }, 30);

    return () => {
      cancelled = true;
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [content, stableOptions]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (href?.startsWith('#')) {
          e.preventDefault();
          const id = href.slice(1);
          const element = containerRef.current?.querySelector(`[id="${id}"]`) as HTMLElement;
          if (element) {
            onHeadingClick?.(id, element);
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    },
    [onHeadingClick]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});
