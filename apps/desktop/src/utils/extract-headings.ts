import { marked } from 'marked';
import type { Token, Tokens } from 'marked';

export interface HeadingItem {
  level: number; // 1-6
  text: string;
  line: number; // 1-based source line number
}

// Line start offsets for O(log n) line lookup
function buildLineIndex(content: string): number[] {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content.charCodeAt(i) === 10 /* \n */) starts.push(i + 1);
  }
  return starts;
}

function lineOf(starts: number[], pos: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (starts[mid] <= pos) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans + 1;
}

// Strip inline markdown syntax for plain-text outline display
function cleanInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]+/g, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Extract headings (H1-H6) using marked's own lexer so the result order
 * exactly matches the order renderer.heading fires during marked.parse
 * (depth-first pre-order, including headings nested in blockquotes/lists).
 * Line numbers are resolved by locating each token's raw source text.
 */
export function extractHeadings(content: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  if (!content.trim()) return headings;

  let tokens: Token[];
  try {
    tokens = marked.lexer(content);
  } catch {
    return headings;
  }

  const lineStarts = buildLineIndex(content);

  const walk = (list: Token[], winStart: number) => {
    let pos = winStart;
    for (const t of list) {
      const raw = (t as { raw?: string }).raw ?? '';
      const idx = raw ? content.indexOf(raw, pos) : -1;
      const start = idx >= 0 ? idx : pos;
      const end = idx >= 0 ? idx + raw.length : pos;

      if (t.type === 'heading') {
        const h = t as Tokens.Heading;
        headings.push({
          level: h.depth,
          text: cleanInline(h.text) || `H${h.depth}`,
          line: lineOf(lineStarts, start),
        });
      }

      // Descend into nested tokens (blockquote, list_item, etc.)
      const nested = (t as { tokens?: Token[] }).tokens;
      if (Array.isArray(nested) && nested.length > 0) walk(nested, start);
      // List tokens carry child items separately
      const items = (t as { items?: Token[] }).items;
      if (Array.isArray(items) && items.length > 0) walk(items, start);

      pos = end;
    }
  };

  walk(tokens, 0);
  return headings;
}
