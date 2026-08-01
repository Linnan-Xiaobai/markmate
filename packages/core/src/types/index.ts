import type { Root } from 'mdast';
import type { Plugin } from 'unified';

export type EditorMode = 'source' | 'wysiwyg' | 'split';

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export interface Range {
  from: Position;
  to: Position;
}

export interface DocumentStats {
  words: number;
  characters: number;
  paragraphs: number;
  readingTime: number;
  headings: number;
  codeBlocks: number;
  images: number;
  links: number;
}

export interface DocumentFrontmatter {
  title?: string;
  date?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  [key: string]: unknown;
}

export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  encoding: string;
}

export interface MarkdownDocument {
  id: string;
  title: string;
  content: string;
  ast?: Root;
  frontmatter?: DocumentFrontmatter;
  stats: DocumentStats;
  file?: FileInfo;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RenderOptions {
  sanitize?: boolean;
  highlight?: boolean;
  math?: boolean;
  mermaid?: boolean;
  gfm?: boolean;
}

export interface MarkdownParser {
  parse(markdown: string): Root;
  stringify(ast: Root): string;
  toHTML(markdown: string, options?: RenderOptions): Promise<string>;
  parseIncremental(chunks: string[]): AsyncGenerator<Root>;
  use(plugin: Plugin): void;
}

export interface Disposable {
  dispose(): void;
}

export type DisposeFn = () => void;

export interface EventEmitter<T = unknown> {
  on(event: string, handler: (data: T) => void): Disposable;
  off(event: string, handler: (data: T) => void): void;
  emit(event: string, data?: T): void;
}
