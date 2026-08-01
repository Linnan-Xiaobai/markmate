import { beforeEach, describe, expect, it } from 'vitest';
import {
  getMockManager,
  installMarkmateAPIMock,
  type MarkmateMock,
  type MarkmateMockOptions,
} from '@markmate/test-utils';
import { cleanupConfigStore, initConfigStore, useConfigStore } from './use-config-store';

/**
 * 集成测试：真实 zustand store + Mock 的 window.markmate IPC 层。
 * 验证配置加载、更新、主进程推送订阅的完整链路。
 */
describe('use-config-store（集成）', () => {
  beforeEach(() => {
    useConfigStore.setState({
      config: useConfigStore.getState().config,
      isLoaded: false,
      settingsOpen: false,
      activeTab: 'editor',
    });
  });

  /** 安装并登记 Mock，afterEach 由全局 setup 统一还原 */
  function setupMock(options?: MarkmateMockOptions): MarkmateMock {
    const mock = installMarkmateAPIMock(options);
    getMockManager().register('markmate-api', () => mock.uninstall());
    return mock;
  }

  it('loadConfig 从 IPC 加载配置', async () => {
    setupMock({ config: { theme: 'light' } });

    await useConfigStore.getState().loadConfig();

    expect(useConfigStore.getState().config.theme).toBe('light');
    expect(useConfigStore.getState().isLoaded).toBe(true);
  });

  it('loadConfig 失败时回退默认配置并标记已加载', async () => {
    const mock = setupMock();
    mock.api.config.get = async () => {
      throw new Error('IPC unavailable');
    };

    await useConfigStore.getState().loadConfig();

    const state = useConfigStore.getState();
    expect(state.isLoaded).toBe(true);
    expect(state.config.theme).toBe('dark'); // DEFAULT_CONFIG
  });

  it('updateConfig 调用 IPC 并同步到 store', async () => {
    const mock = setupMock();

    await useConfigStore.getState().updateConfig({ editor: { fontSize: 18 } as never });

    expect(mock.spies.configSet).toHaveBeenCalledOnce();
    expect(useConfigStore.getState().config.editor.fontSize).toBe(18);
  });

  it('initConfigStore 订阅主进程配置推送，cleanup 后退订', () => {
    const mock = setupMock();

    initConfigStore();
    mock.emit.configChange({ ...mock.getConfig(), theme: 'light' });
    expect(useConfigStore.getState().config.theme).toBe('light');

    cleanupConfigStore();
    mock.emit.configChange({ ...mock.getConfig(), theme: 'dark' });
    expect(useConfigStore.getState().config.theme).toBe('light'); // 不再更新
  });
});
