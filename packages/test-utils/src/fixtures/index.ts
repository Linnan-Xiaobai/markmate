import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** 内置 Markdown 测试素材（不落盘，适合单元/集成测试直接使用） */
export const MARKDOWN_FIXTURES = {
  simple: '# Hello\n\nWorld.\n',
  empty: '',
  unicode: '# 中文标题\n\n你好，世界！这是一个中文测试文档。\n',
  frontmatter: '---\ntitle: 带元数据的文档\nauthor: test\ntags:\n  - markdown\n---\n\n# 正文\n',
  gfm: '| A | B |\n|---|---|\n| 1 | 2 |\n\n- [x] done\n- [ ] todo\n\n~~删除线~~\n',
  code: '# 代码示例\n\n```typescript\nfunction greet(name: string): string {\n  return `Hello, ${name}`;\n}\n```\n\n```python\ndef greet(name):\n    return f"Hello, {name}"\n```\n',
  links: '# 链接\n\n[外链](https://example.com)\n\n[内链](#anchor)\n\n![图片](https://example.com/image.png)\n',
} as const;

export type MarkdownFixtureName = keyof typeof MARKDOWN_FIXTURES;

/** 生成大体量 Markdown，用于性能/内存相关测试 */
export function generateLargeMarkdown(lineCount = 5000): string {
  const lines: string[] = ['# 大文件测试\n'];
  for (let i = 1; i <= lineCount; i++) {
    lines.push(`第 ${i} 行：这是用于性能测试的重复内容，包含一些 **格式** 标记。`);
  }
  return lines.join('\n');
}

function getFixturesDir(): string {
  return process.env.MARKMATE_FIXTURES_DIR ?? path.resolve(process.cwd(), 'tests/fixtures');
}

/**
 * 从 tests/fixtures 目录加载测试素材文件。
 * 仅可在 Node 环境（vitest）中调用。
 */
export function loadFixture(name: string): string {
  const filePath = path.join(getFixturesDir(), name);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

export interface SeededWorkspace {
  /** 临时工作区根目录 */
  dir: string;
  /** 删除整个工作区 */
  cleanup(): void;
}

/**
 * 在系统临时目录创建真实文件树，用于集成测试与 E2E 测试
 * （需要真实文件 IO 的场景，如主进程 fs 处理器测试）。
 */
export function seedWorkspace(files: Record<string, string>, baseDir?: string): SeededWorkspace {
  const root = baseDir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'markmate-test-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const target = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf-8');
  }
  return {
    dir: root,
    cleanup() {
      // Windows 上文件句柄释放有延迟，启用重试避免偶发 EPERM/EBUSY
      fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    },
  };
}
