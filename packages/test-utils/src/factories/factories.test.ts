import { describe, expect, it } from 'vitest';
import {
  createMockConfig,
  createMockFileTree,
  createMockMarkdown,
  createMockTab,
  defineFactory,
  resetFactorySeq,
} from './index';

describe('defineFactory', () => {
  it('每次调用递增序号，支持覆盖默认值', () => {
    const create = defineFactory((seq) => ({ id: seq, name: `item-${seq}` }));

    const first = create();
    const second = create({ name: 'custom' });

    expect(second.id).toBe(first.id + 1);
    expect(second.name).toBe('custom');
  });

  it('resetFactorySeq 后序号重新从 1 开始', () => {
    const create = defineFactory((seq) => ({ id: seq }));

    create();
    resetFactorySeq();

    expect(create().id).toBe(1);
  });
});

describe('createMockConfig', () => {
  it('生成完整默认配置', () => {
    const config = createMockConfig();

    expect(config.theme).toBe('dark');
    expect(config.editor.fontSize).toBe(14);
    expect(config.autoSave.enabled).toBe(true);
  });

  it('支持顶层覆盖', () => {
    expect(createMockConfig({ theme: 'light' }).theme).toBe('light');
  });
});

describe('createMockTab', () => {
  it('生成唯一 id 的标签页', () => {
    const a = createMockTab();
    const b = createMockTab();

    expect(a.id).not.toBe(b.id);
    expect(b.isDirty).toBe(false);
  });
});

describe('createMockFileTree', () => {
  it('按深度/广度/文件数生成文件映射', () => {
    const tree = createMockFileTree({ depth: 2, breadth: 2, filesPerDir: 3, root: '/w' });

    // 根目录 3 个 + 2 个子目录各 3 个
    expect(Object.keys(tree)).toHaveLength(9);
    expect(tree['/w/file-1.md']).toContain('# 文件 1');
  });
});

describe('createMockMarkdown', () => {
  it('包含标题与指定章节数', () => {
    const md = createMockMarkdown({ title: 'Demo', sections: 2 });

    expect(md).toContain('# Demo');
    expect(md).toContain('## 章节 2');
    expect(md).not.toContain('## 章节 3');
  });

  it('frontmatter 与 GFM 按需输出', () => {
    const md = createMockMarkdown({ frontmatter: true, gfm: true });

    expect(md.startsWith('---')).toBe(true);
    expect(md).toContain('| 列 A | 列 B |');
    expect(md).toContain('- [ ] 待办任务');
  });
});
