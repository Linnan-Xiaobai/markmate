import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateLargeMarkdown, loadFixture, MARKDOWN_FIXTURES, seedWorkspace, type SeededWorkspace } from './index';

describe('MARKDOWN_FIXTURES', () => {
  it('内置素材可直接使用', () => {
    expect(MARKDOWN_FIXTURES.simple).toContain('# Hello');
    expect(MARKDOWN_FIXTURES.unicode).toContain('中文');
    expect(MARKDOWN_FIXTURES.gfm).toContain('- [x] done');
  });
});

describe('generateLargeMarkdown', () => {
  it('按行数生成内容', () => {
    const md = generateLargeMarkdown(100);

    expect(md.split('\n').length).toBeGreaterThanOrEqual(100);
    expect(md).toContain('第 100 行');
  });
});

describe('loadFixture', () => {
  it('加载 tests/fixtures 目录中的文件', () => {
    const content = loadFixture('sample.md');

    expect(content.length).toBeGreaterThan(0);
  });

  it('文件不存在时抛出明确错误', () => {
    expect(() => loadFixture('no-such-file.md')).toThrow('Fixture not found');
  });
});

describe('seedWorkspace', () => {
  let workspace: SeededWorkspace | null = null;

  afterEach(() => {
    workspace?.cleanup();
    workspace = null;
  });

  it('在临时目录创建真实文件树', () => {
    workspace = seedWorkspace({
      'docs/a.md': '# A',
      'docs/sub/b.md': '# B',
    });

    expect(fs.readFileSync(path.join(workspace.dir, 'docs/a.md'), 'utf-8')).toBe('# A');
    expect(fs.existsSync(path.join(workspace.dir, 'docs/sub/b.md'))).toBe(true);
  });

  it('cleanup 删除整个工作区', (ctx) => {
    // 部分沙箱环境禁止递归删除目录，按实际用法探测后跳过
    const probe = path.join(os.tmpdir(), `markmate-probe-${Date.now()}`);
    fs.mkdirSync(probe, { recursive: true });
    fs.writeFileSync(path.join(probe, 'probe.txt'), 'x');
    fs.rmSync(probe, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    if (fs.existsSync(probe)) {
      ctx.skip();
      return;
    }

    workspace = seedWorkspace({ 'a.md': 'A' });
    const dir = workspace.dir;

    workspace.cleanup();

    expect(fs.existsSync(dir)).toBe(false);
    workspace = null;
  });
});
