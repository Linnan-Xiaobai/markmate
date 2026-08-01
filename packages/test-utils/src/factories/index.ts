let factorySeq = 0;

function nextSeq(): number {
  factorySeq += 1;
  return factorySeq;
}

/** 重置工厂序列号（测试间需要确定性数据时使用） */
export function resetFactorySeq(): void {
  factorySeq = 0;
}

/**
 * 定义一个数据工厂：每次调用生成带递增序号的默认数据，可用 overrides 覆盖。
 */
export function defineFactory<T>(build: (seq: number) => T): (overrides?: Partial<T>) => T {
  return (overrides?: Partial<T>) => ({ ...build(nextSeq()), ...overrides });
}

/** 与 apps/desktop 的 AppConfig 结构一致 */
export interface MockAppConfig {
  theme: 'light' | 'dark' | 'system';
  editor: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    tabSize: number;
    wordWrap: boolean;
    showLineNumbers: boolean;
    highlightActiveLine: boolean;
  };
  preview: {
    fontSize: number;
    lineHeight: number;
    maxWidth: number;
  };
  autoSave: {
    enabled: boolean;
    interval: number;
  };
  ui: {
    sidebarWidth: number;
    showStatusBar: boolean;
  };
}

export const createMockConfig = defineFactory<MockAppConfig>(() => ({
  theme: 'dark',
  editor: {
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    fontSize: 14,
    lineHeight: 1.6,
    tabSize: 2,
    wordWrap: true,
    showLineNumbers: true,
    highlightActiveLine: true,
  },
  preview: {
    fontSize: 16,
    lineHeight: 1.8,
    maxWidth: 900,
  },
  autoSave: {
    enabled: true,
    interval: 30000,
  },
  ui: {
    sidebarWidth: 260,
    showStatusBar: true,
  },
}));

/** 与 apps/desktop use-tabs-store 的 Tab 结构一致 */
export interface MockTab {
  id: string;
  filePath: string | null;
  fileName: string;
  content: string;
  isDirty: boolean;
  cursorLine: number;
  cursorColumn: number;
  wordCount: number;
  charCount: number;
}

export const createMockTab = defineFactory<MockTab>((seq) => {
  const content = `# 测试文档 ${seq}\n\n这是工厂生成的测试内容。`;
  return {
    id: `tab-${seq}`,
    filePath: `/docs/doc-${seq}.md`,
    fileName: `doc-${seq}.md`,
    content,
    isDirty: false,
    cursorLine: 1,
    cursorColumn: 1,
    wordCount: 4,
    charCount: content.length,
  };
});

/** 与 preload FileItem 结构一致 */
export interface MockFileItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

export const createMockFileItem = defineFactory<MockFileItem>((seq) => ({
  name: `file-${seq}.md`,
  path: `/docs/file-${seq}.md`,
  isDirectory: false,
}));

export interface MockFileTreeOptions {
  /** 目录深度，默认 2 */
  depth?: number;
  /** 每层目录数量，默认 2 */
  breadth?: number;
  /** 每个目录下的文件数，默认 3 */
  filesPerDir?: number;
  /** 根路径，默认 '/workspace' */
  root?: string;
}

/**
 * 生成嵌套文件树，返回 { 文件路径: 内容 } 映射，
 * 可直接作为 installMarkmateAPIMock({ files }) 的输入。
 */
export function createMockFileTree(options: MockFileTreeOptions = {}): Record<string, string> {
  const { depth = 2, breadth = 2, filesPerDir = 3, root = '/workspace' } = options;
  const files: Record<string, string> = {};
  let counter = 0;

  const fill = (dir: string, level: number) => {
    for (let i = 1; i <= filesPerDir; i++) {
      counter += 1;
      files[`${dir}/file-${counter}.md`] = `# 文件 ${counter}\n\n路径：${dir}/file-${counter}.md\n`;
    }
    if (level < depth) {
      for (let i = 1; i <= breadth; i++) {
        fill(`${dir}/dir-${level}-${i}`, level + 1);
      }
    }
  };

  fill(root, 1);
  return files;
}

export interface MockMarkdownOptions {
  title?: string;
  /** 章节数量，默认 3 */
  sections?: number;
  /** 是否包含代码块，默认 true */
  codeBlock?: boolean;
  /** 是否包含 GFM 表格与任务列表，默认 false */
  gfm?: boolean;
  /** 是否包含 frontmatter，默认 false */
  frontmatter?: boolean;
}

/** 生成结构可控的 Markdown 文本 */
export function createMockMarkdown(options: MockMarkdownOptions = {}): string {
  const {
    title = '测试文档',
    sections = 3,
    codeBlock = true,
    gfm = false,
    frontmatter = false,
  } = options;

  const parts: string[] = [];
  if (frontmatter) {
    parts.push(`---\ntitle: ${title}\ntags:\n  - test\n  - mock\n---\n`);
  }
  parts.push(`# ${title}\n`);

  for (let i = 1; i <= sections; i++) {
    parts.push(`## 章节 ${i}\n\n这是第 ${i} 章节的测试内容，包含 **加粗** 与 *斜体*。\n`);
  }

  if (codeBlock) {
    parts.push('```typescript\nconst answer: number = 42;\n```\n');
  }

  if (gfm) {
    parts.push('| 列 A | 列 B |\n| ---- | ---- |\n| a1   | b1   |\n| a2   | b2   |\n');
    parts.push('- [x] 已完成任务\n- [ ] 待办任务\n');
  }

  return parts.join('\n');
}
