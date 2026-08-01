import { nanoid } from 'nanoid';
import type { MarkdownDocument, DocumentStats, MarkdownParser } from '../types';
import { EventEmitter } from '../utils/event-emitter';
import { calculateStats, extractTitle } from '../utils/document-stats';
import { parseFrontmatter, stringifyFrontmatter } from '../parser/frontmatter';
import { createParser } from '../parser';

interface DocumentServiceEvents {
  'document:created': MarkdownDocument;
  'document:opened': MarkdownDocument;
  'document:changed': { document: MarkdownDocument; content: string };
  'document:saved': MarkdownDocument;
  'document:closed': string;
}

export class DocumentService {
  private documents = new Map<string, MarkdownDocument>();
  private parser: MarkdownParser;
  private events = new EventEmitter<DocumentServiceEvents>();
  private currentDocumentId: string | null = null;

  constructor(parser?: MarkdownParser) {
    this.parser = parser || createParser();
  }

  get on() {
    return this.events.on.bind(this.events);
  }

  createDocument(content = '', filePath?: string): MarkdownDocument {
    const id = nanoid();
    const now = new Date();

    const { frontmatter, content: bodyContent } = parseFrontmatter(content);
    const ast = this.parser.parse(bodyContent);
    const title = extractTitle(ast, frontmatter?.title || 'Untitled');
    const stats = calculateStats(ast, bodyContent);
    const tags = frontmatter?.tags || [];

    const document: MarkdownDocument = {
      id,
      title,
      content: bodyContent,
      ast,
      frontmatter,
      stats,
      tags,
      createdAt: now,
      updatedAt: now,
    };

    if (filePath) {
      document.file = {
        path: filePath,
        name: filePath.split(/[/\\]/).pop() || 'untitled.md',
        extension: '.md',
        size: content.length,
        lastModified: now,
        encoding: 'utf-8',
      };
    }

    this.documents.set(id, document);
    this.events.emit('document:created', document);
    return document;
  }

  openDocument(content: string, filePath?: string): MarkdownDocument {
    const document = this.createDocument(content, filePath);
    this.currentDocumentId = document.id;
    this.events.emit('document:opened', document);
    return document;
  }

  updateContent(id: string, content: string): MarkdownDocument | null {
    const document = this.documents.get(id);
    if (!document) return null;

    const { frontmatter, content: bodyContent } = parseFrontmatter(content);
    const ast = this.parser.parse(bodyContent);
    const title = extractTitle(ast, frontmatter?.title || document.file?.name || 'Untitled');
    const stats = calculateStats(ast, bodyContent);
    const tags = frontmatter?.tags || document.tags;

    document.content = bodyContent;
    document.ast = ast;
    document.frontmatter = frontmatter;
    document.title = title;
    document.stats = stats;
    document.tags = tags;
    document.updatedAt = new Date();

    this.events.emit('document:changed', { document, content: bodyContent });
    return document;
  }

  saveDocument(id: string): MarkdownDocument | null {
    const document = this.documents.get(id);
    if (!document) return null;

    document.updatedAt = new Date();
    this.events.emit('document:saved', document);
    return document;
  }

  closeDocument(id: string): boolean {
    const deleted = this.documents.delete(id);
    if (deleted) {
      if (this.currentDocumentId === id) {
        this.currentDocumentId = null;
      }
      this.events.emit('document:closed', id);
    }
    return deleted;
  }

  getDocument(id: string): MarkdownDocument | undefined {
    return this.documents.get(id);
  }

  getCurrentDocument(): MarkdownDocument | null {
    if (!this.currentDocumentId) return null;
    return this.documents.get(this.currentDocumentId) || null;
  }

  getAllDocuments(): MarkdownDocument[] {
    return Array.from(this.documents.values());
  }

  setCurrentDocument(id: string): boolean {
    if (this.documents.has(id)) {
      this.currentDocumentId = id;
      return true;
    }
    return false;
  }

  serializeDocument(id: string): string | null {
    const document = this.documents.get(id);
    if (!document) return null;

    if (document.frontmatter && Object.keys(document.frontmatter).length > 0) {
      return stringifyFrontmatter(document.frontmatter, document.content);
    }

    return document.content;
  }

  getParser(): MarkdownParser {
    return this.parser;
  }
}

export const documentService = new DocumentService();
