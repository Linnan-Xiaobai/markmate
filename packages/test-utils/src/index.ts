export { MockManager, getMockManager } from './manager';
export type { MockRestoreFn } from './manager';

export { VirtualFileSystem, normalizePath } from './mocks/virtual-fs';
export type { VirtualFileItem, VirtualReadResult, VirtualWriteResult, VirtualDirectoryResult } from './mocks/virtual-fs';

export { createMarkmateMock, installMarkmateAPIMock } from './mocks/markmate-api';
export type { MockMarkmateAPI, MarkmateMock, MarkmateMockOptions } from './mocks/markmate-api';

export { installBrowserMocks } from './mocks/browser';
export type { BrowserMockOptions } from './mocks/browser';

export { createMockIpcBridge } from './mocks/electron-ipc';
export type { MockIpcMain, MockIpcRenderer, MockIpcBridge } from './mocks/electron-ipc';

export {
  defineFactory,
  resetFactorySeq,
  createMockConfig,
  createMockTab,
  createMockFileItem,
  createMockFileTree,
  createMockMarkdown,
} from './factories';
export type {
  MockAppConfig,
  MockTab,
  MockFileItem,
  MockFileTreeOptions,
  MockMarkdownOptions,
} from './factories';

export {
  MARKDOWN_FIXTURES,
  generateLargeMarkdown,
  loadFixture,
  seedWorkspace,
} from './fixtures';
export type { MarkdownFixtureName, SeededWorkspace } from './fixtures';

export { E2E_FILE_TREE, E2E_CONFIG_PRESETS, createMarkmateInitScript } from './e2e';
