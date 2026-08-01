import { describe, expect, it } from 'vitest';
import { createMarkmateInitScript, E2E_CONFIG_PRESETS, E2E_FILE_TREE } from './index';

interface InjectedPage {
  markmate: {
    fs: {
      readFile: (p: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    };
  };
}

describe('E2E_FILE_TREE', () => {
  it('包含标准工作区文件', () => {
    expect(Object.keys(E2E_FILE_TREE).length).toBeGreaterThan(5);
    expect(E2E_FILE_TREE['/e2e-workspace/welcome.md']).toContain('E2E Welcome');
    expect(E2E_FILE_TREE['/e2e-workspace/notes/待办.md']).toContain('待办事项');
  });
});

describe('E2E_CONFIG_PRESETS', () => {
  it('提供常用配置预设', () => {
    expect(E2E_CONFIG_PRESETS.lightTheme.theme).toBe('light');
    expect(E2E_CONFIG_PRESETS.autoSaveOff.autoSave.enabled).toBe(false);
  });
});

describe('createMarkmateInitScript', () => {
  it('生成可执行的初始化脚本并在页面上下文安装 window.markmate', async () => {
    const script = createMarkmateInitScript({ files: { '/e2e/a.md': '# E2E' } });

    // 在测试上下文中模拟页面：执行脚本后 window.markmate 应可用
    const fn = new Function(script);
    fn();

    const api = (window as unknown as InjectedPage).markmate;
    const result = await api.fs.readFile('/e2e/a.md');
    expect(result.success).toBe(true);
    expect(result.content).toBe('# E2E');

    delete (window as unknown as Record<string, unknown>).markmate;
  });

  it('脚本中的文件读取对缺失路径返回错误', async () => {
    const script = createMarkmateInitScript({ files: {} });
    new Function(script)();

    const api = (window as unknown as InjectedPage).markmate;
    const result = await api.fs.readFile('/missing.md');

    expect(result.success).toBe(false);

    delete (window as unknown as Record<string, unknown>).markmate;
  });
});
