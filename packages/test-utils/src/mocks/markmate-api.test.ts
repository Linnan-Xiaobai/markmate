import { afterEach, describe, expect, it } from 'vitest';
import { installMarkmateAPIMock, type MarkmateMock } from './markmate-api';
import { createMockConfig } from '../factories';

describe('installMarkmateAPIMock', () => {
  let mock: MarkmateMock;

  afterEach(() => {
    mock?.uninstall();
  });

  it('安装后 window.markmate 可用，卸载后移除', () => {
    mock = installMarkmateAPIMock();
    expect(window.markmate).toBe(mock.api);

    mock.uninstall();
    expect((window as unknown as Record<string, unknown>).markmate).toBeUndefined();
  });

  it('readFile 命中虚拟文件系统并记录 spy', async () => {
    mock = installMarkmateAPIMock({ files: { '/docs/a.md': '# A' } });

    const result = await window.markmate.fs.readFile('/docs/a.md');

    expect(result).toEqual({ success: true, content: '# A', size: 3 });
    expect(mock.spies.readFile).toHaveBeenCalledWith('/docs/a.md');
  });

  it('readFile 不存在时返回错误对象而非抛异常', async () => {
    mock = installMarkmateAPIMock();

    const result = await window.markmate.fs.readFile('/missing.md');

    expect(result.success).toBe(false);
    expect(result.error).toContain('File not found');
  });

  it('failOn 注入读取失败', async () => {
    mock = installMarkmateAPIMock({
      files: { '/docs/a.md': '# A' },
      failOn: { readFile: 'disk error' },
    });

    const result = await window.markmate.fs.readFile('/docs/a.md');
    expect(result).toEqual({ success: false, error: 'disk error' });
  });

  it('writeFile 写入后可读取', async () => {
    mock = installMarkmateAPIMock({ files: { '/docs/a.md': 'old' } });

    await window.markmate.fs.writeFile('/docs/a.md', 'new');
    const result = await window.markmate.fs.readFile('/docs/a.md');

    expect(result.content).toBe('new');
  });

  it('config.set 深度合并并广播 config:changed', async () => {
    mock = installMarkmateAPIMock({ config: { theme: 'light' } });

    const changes: unknown[] = [];
    const unsubscribe = window.markmate.config.onChange((config) => changes.push(config));

    const next = await window.markmate.config.set({ editor: { fontSize: 20 } as never });

    expect(next.theme).toBe('light');
    expect(next.editor.fontSize).toBe(20);
    expect(next.editor.tabSize).toBe(2); // 未覆盖字段保留
    expect(changes).toHaveLength(1);

    unsubscribe();
    await window.markmate.config.set({ theme: 'dark' });
    expect(changes).toHaveLength(1); // 退订后不再收到
  });

  it('config.reset 恢复默认配置', async () => {
    mock = installMarkmateAPIMock({ config: { theme: 'light' } });

    const reset = await window.markmate.config.reset();

    expect(reset).toEqual(createMockConfig());
  });

  it('emit.fileOpen 触发订阅回调', () => {
    mock = installMarkmateAPIMock();
    const opened: string[] = [];
    window.markmate.on.fileOpen((filePath) => opened.push(filePath));

    mock.emit.fileOpen('/docs/x.md');

    expect(opened).toEqual(['/docs/x.md']);
  });

  it('emit.fileSave / fileSaveAs 触发无参回调', () => {
    mock = installMarkmateAPIMock();
    let saved = 0;
    let savedAs = 0;
    window.markmate.on.fileSave(() => saved++);
    window.markmate.on.fileSaveAs(() => savedAs++);

    mock.emit.fileSave();
    mock.emit.fileSaveAs();

    expect(saved).toBe(1);
    expect(savedAs).toBe(1);
  });

  it('setTheme system 解析为 light', async () => {
    mock = installMarkmateAPIMock({ theme: 'dark' });

    expect(await window.markmate.app.setTheme('system')).toBe('light');
    expect(await window.markmate.app.setTheme('dark')).toBe('dark');
    expect(mock.getTheme()).toBe('dark');
  });

  it('window.maximize 切换状态并广播', async () => {
    mock = installMarkmateAPIMock();
    const states: boolean[] = [];
    window.markmate.window.onMaximizedChange((v) => states.push(v));

    await window.markmate.window.maximize();

    expect(await window.markmate.window.isMaximized()).toBe(true);
    expect(states).toEqual([true]);
  });

  it('path 工具与 Node path 行为一致', async () => {
    mock = installMarkmateAPIMock();

    expect(await window.markmate.path.basename('/a/b/c.md')).toBe('c.md');
    expect(await window.markmate.path.basename('C:\\docs\\c.md')).toBe('c.md');
    expect(await window.markmate.path.dirname('/a/b/c.md')).toBe('/a/b');
    expect(await window.markmate.path.join('/a', 'b', 'c.md')).toBe('/a/b/c.md');
  });

  it('notifySavedForClose 记录调用', () => {
    mock = installMarkmateAPIMock();

    window.markmate.app.notifySavedForClose();

    expect(mock.spies.notifySavedForClose).toHaveBeenCalledOnce();
  });
});
