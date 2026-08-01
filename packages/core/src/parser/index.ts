import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeRaw from 'rehype-raw';
import DOMPurify from 'dompurify';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import type { MarkdownParser, RenderOptions } from '../types';

const DEFAULT_OPTIONS: Required<RenderOptions> = {
  sanitize: true,
  highlight: true,
  math: true,
  mermaid: false,
  gfm: true,
};

const SANITIZE_SCHEMA = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'math',
    'semantics',
    'mrow',
    'mi',
    'mn',
    'mo',
    'msup',
    'msub',
    'mfrac',
    'mroot',
    'msqrt',
    'mtext',
    'annotation',
    'svg',
    'path',
    'mermaid-diagram',
    'math-block',
    'math-inline',
  ],
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div || []), 'className', 'data-language', 'data-source'],
    code: [...(defaultSchema.attributes?.code || []), 'className', 'data-language'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'style'],
    pre: [...(defaultSchema.attributes?.pre || []), 'className', 'data-language'],
    svg: ['viewBox', 'width', 'height', 'xmlns'],
    path: ['d'],
    annotation: ['encoding'],
    'mermaid-diagram': ['data-source'],
    'math-block': ['data-source'],
    a: ['href', 'title', 'target', 'rel', 'className'],
  },
};

export interface CreateParserOptions {
  defaultOptions?: Partial<RenderOptions>;
  plugins?: Plugin[];
}

export function createParser(options: CreateParserOptions = {}): MarkdownParser {
  const { defaultOptions: userDefaultOptions = {}, plugins: initialPlugins = [] } = options;
  const globalDefaults: Required<RenderOptions> = { ...DEFAULT_OPTIONS, ...userDefaultOptions };
  const plugins = [...initialPlugins];

  let cachedBaseProcessor: ReturnType<typeof createBaseProcessor> | null = null;
  const htmlProcessorCache = new Map<string, ReturnType<typeof buildHtmlProcessor>>();

  function createBaseProcessor() {
    const processor = unified().use(remarkParse);

    if (globalDefaults.gfm) {
      processor.use(remarkGfm);
    }

    if (globalDefaults.math) {
      processor.use(remarkMath);
    }

    for (const plugin of plugins) {
      processor.use(plugin);
    }

    return processor;
  }

  function getBaseProcessor() {
    if (!cachedBaseProcessor) {
      cachedBaseProcessor = createBaseProcessor();
    }
    return cachedBaseProcessor;
  }

  function buildHtmlProcessor(opts: Required<RenderOptions>) {
    const processor = unified().use(remarkParse);

    if (opts.gfm) {
      processor.use(remarkGfm);
    }

    if (opts.math) {
      processor.use(remarkMath);
    }

    for (const plugin of plugins) {
      processor.use(plugin);
    }

    processor.use(remarkRehype, { allowDangerousHtml: true }).use(rehypeRaw);

    if (opts.math) {
      processor.use(rehypeKatex);
    }

    if (opts.sanitize) {
      processor.use(rehypeSanitize, SANITIZE_SCHEMA);
    }

    processor.use(rehypeStringify);

    return processor;
  }

  function getHtmlProcessor(renderOpts?: RenderOptions) {
    const opts: Required<RenderOptions> = { ...globalDefaults, ...renderOpts };
    const cacheKey = JSON.stringify(opts);

    if (!htmlProcessorCache.has(cacheKey)) {
      htmlProcessorCache.set(cacheKey, buildHtmlProcessor(opts));
      if (htmlProcessorCache.size > 10) {
        const firstKey = htmlProcessorCache.keys().next().value;
        if (firstKey) htmlProcessorCache.delete(firstKey);
      }
    }

    return htmlProcessorCache.get(cacheKey)!;
  }

  function invalidateCache() {
    cachedBaseProcessor = null;
    htmlProcessorCache.clear();
  }

  return {
    parse(markdown: string): Root {
      const processor = getBaseProcessor();
      return processor.parse(markdown);
    },

    stringify(ast: Root): string {
      const processor = unified().use(remarkStringify, {
        bullet: '-',
        fence: '`',
        fences: true,
        incrementListMarker: true,
        listItemIndent: 'one',
        strong: '*',
        emphasis: '_',
      });
      return processor.stringify(ast);
    },

    async toHTML(markdown: string, renderOpts?: RenderOptions): Promise<string> {
      const opts: Required<RenderOptions> = { ...globalDefaults, ...renderOpts };
      const processor = getHtmlProcessor(renderOpts);
      const result = await processor.process(markdown);
      let html = String(result);

      if (opts.sanitize && typeof window !== 'undefined') {
        html = DOMPurify.sanitize(html, {
          ADD_TAGS: SANITIZE_SCHEMA.tagNames,
          ADD_ATTR: ['data-language', 'viewBox', 'encoding', 'xmlns', 'data-source'],
        });
      }

      return html;
    },

    async *parseIncremental(chunks: string[]): AsyncGenerator<Root> {
      let mergedAst: Root | null = null;
      for (const chunk of chunks) {
        const chunkAst = this.parse(chunk);
        if (!mergedAst) {
          mergedAst = chunkAst;
        } else {
          mergedAst.children.push(...chunkAst.children);
        }
        yield { ...mergedAst };
        await new Promise((resolve) => {
          if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => resolve(null), { timeout: 50 });
          } else {
            setTimeout(resolve, 0);
          }
        });
      }
    },

    use(plugin: Plugin): void {
      plugins.push(plugin);
      invalidateCache();
    },
  };
}

export const defaultParser = createParser();
