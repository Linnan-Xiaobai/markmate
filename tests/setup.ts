import { afterEach } from 'vitest';
import { getMockManager, installBrowserMocks } from '@markmate/test-utils';

// 安装 jsdom 缺失的浏览器 API（matchMedia、ResizeObserver 等）
installBrowserMocks();

// 每个用例结束后统一还原所有通过 MockManager 登记的 Mock
afterEach(() => {
  getMockManager().restoreAll();
});
