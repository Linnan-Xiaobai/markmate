import { describe, expect, it } from 'vitest';
import { VirtualFileSystem, normalizePath } from './virtual-fs';

describe('normalizePath', () => {
  it('统一 Windows 路径分隔符', () => {
    expect(normalizePath('C:\\docs\\a.md')).toBe('C:/docs/a.md');
    expect(normalizePath('/docs/a.md')).toBe('/docs/a.md');
  });

  it('去除尾部斜杠', () => {
    expect(normalizePath('/docs/')).toBe('/docs');
  });
});

describe('VirtualFileSystem', () => {
  it('构造时播种文件并自动派生父目录', () => {
    const vfs = new VirtualFileSystem({ '/docs/sub/a.md': 'A' });

    expect(vfs.isFile('/docs/sub/a.md')).toBe(true);
    expect(vfs.isDirectory('/docs/sub')).toBe(true);
    expect(vfs.isDirectory('/docs')).toBe(true);
  });

  it('readFile 返回内容与字节大小', () => {
    const vfs = new VirtualFileSystem({ '/a.md': '你好' });

    const result = vfs.readFile('/a.md');

    expect(result.success).toBe(true);
    expect(result.content).toBe('你好');
    expect(result.size).toBe(6); // UTF-8 每字 3 字节
  });

  it('writeFile 到不存在的目录时失败', () => {
    const vfs = new VirtualFileSystem();

    expect(vfs.writeFile('/no-such-dir/a.md', 'x').success).toBe(false);
    expect(vfs.writeFile('/a.md', 'x').success).toBe(true); // 根目录可直接写
  });

  it('readDirectory 仅列出直接子项，目录在前按名称排序', () => {
    const vfs = new VirtualFileSystem({
      '/root/b.md': 'b',
      '/root/a.md': 'a',
      '/root/sub/c.md': 'c',
      '/root/aaa/x.md': 'x',
    });

    const result = vfs.readDirectory('/root');

    expect(result.success).toBe(true);
    expect(result.items?.map((i) => i.name)).toEqual(['aaa', 'sub', 'a.md', 'b.md']);
    expect(result.items?.[0]?.isDirectory).toBe(true);
    expect(result.items?.[2]?.isDirectory).toBe(false);
  });

  it('readDirectory 超过 maxItems 时截断并标记', () => {
    const vfs = new VirtualFileSystem({
      '/r/1.md': '1',
      '/r/2.md': '2',
      '/r/3.md': '3',
    });

    const result = vfs.readDirectory('/r', 2);

    expect(result.items).toHaveLength(2);
    expect(result.truncated).toBe(true);
  });

  it('readDirectory 不存在的目录返回错误', () => {
    const vfs = new VirtualFileSystem();

    expect(vfs.readDirectory('/nope').success).toBe(false);
  });

  it('Windows 路径与 POSIX 路径等价访问', () => {
    const vfs = new VirtualFileSystem({ '/docs/a.md': 'A' });

    expect(vfs.readFile('\\docs\\a.md').success).toBe(true);
  });

  it('snapshot 导出全部文件', () => {
    const vfs = new VirtualFileSystem({ '/a.md': 'A', '/b/c.md': 'C' });

    expect(vfs.snapshot()).toEqual({ '/a.md': 'A', '/b/c.md': 'C' });
  });
});
