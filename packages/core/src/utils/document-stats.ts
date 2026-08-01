import type { Root } from 'mdast';
import { toString } from 'mdast-util-to-string';
import type { DocumentStats } from '../types';

const WORDS_PER_MINUTE = 200;

export function calculateStats(ast: Root, content: string): DocumentStats {
  const text = toString(ast);

  const words = countWords(text);
  const characters = content.length;
  const paragraphs = countNodes(ast, 'paragraph');
  const headings = countNodes(ast, 'heading');
  const codeBlocks = countNodes(ast, 'code');
  const images = countNodes(ast, 'image');
  const links = countNodes(ast, 'link');
  const readingTime = Math.ceil(words / WORDS_PER_MINUTE);

  return {
    words,
    characters,
    paragraphs,
    readingTime,
    headings,
    codeBlocks,
    images,
    links,
  };
}

function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

type NodeType = Root['children'][number]['type'];

function countNodes(ast: Root, type: NodeType): number {
  let count = 0;

  function visit(node: Root | Root['children'][number]) {
    if (node.type === type) {
      count++;
    }
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }

  visit(ast);
  return count;
}

export function extractTitle(ast: Root, fallback?: string): string {
  const firstHeading = ast.children.find(
    (node): node is Extract<Root['children'][number], { type: 'heading' }> =>
      node.type === 'heading' && node.depth === 1
  );

  if (firstHeading) {
    return toString(firstHeading).trim();
  }

  return fallback || 'Untitled';
}

export function extractHeadings(ast: Root): Array<{
  depth: number;
  text: string;
  id: string;
}> {
  const headings: Array<{ depth: number; text: string; id: string }> = [];
  const slugger = createSlugger();

  function visit(node: Root | Root['children'][number]) {
    if (node.type === 'heading') {
      const text = toString(node);
      const id = slugger.slug(text);
      headings.push({
        depth: node.depth,
        text,
        id,
      });
    }
    if ('children' in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        visit(child);
      }
    }
  }

  visit(ast);
  return headings;
}

function createSlugger() {
  const slugs = new Map<string, number>();

  return {
    slug(value: string): string {
      let slug = value
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5-]/g, '')
        .replace(/^-+|-+$/g, '');

      const count = slugs.get(slug) || 0;
      slugs.set(slug, count + 1);

      if (count > 0) {
        slug = `${slug}-${count}`;
      }

      return slug;
    },
  };
}
