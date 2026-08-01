import { describe, expect, it } from 'vitest';
import { createMockIpcBridge } from './electron-ipc';

describe('createMockIpcBridge', () => {
  it('invoke 路由到对应通道的处理器并透传参数', async () => {
    const { ipcMain, ipcRenderer } = createMockIpcBridge();
    ipcMain.handle('fs:read-file', (_event, filePath) => ({ success: true, content: `content of ${filePath}` }));

    const result = await ipcRenderer.invoke('fs:read-file', '/a.md');

    expect(result).toEqual({ success: true, content: 'content of /a.md' });
  });

  it('未注册通道 invoke 时 reject', async () => {
    const { ipcRenderer } = createMockIpcBridge();

    await expect(ipcRenderer.invoke('missing')).rejects.toThrow('No handler registered');
  });

  it('removeHandler 移除后通道不可用', async () => {
    const { ipcMain, ipcRenderer } = createMockIpcBridge();
    ipcMain.handle('ch', () => 1);
    ipcMain.removeHandler('ch');

    await expect(ipcRenderer.invoke('ch')).rejects.toThrow();
  });

  it('emit 模拟主进程推送，removeListener 退订', () => {
    const { ipcRenderer } = createMockIpcBridge();
    const received: unknown[] = [];
    const listener = (_event: unknown, payload: unknown) => received.push(payload);

    ipcRenderer.on('file:open', listener);
    ipcRenderer.emit('file:open', '/x.md');
    ipcRenderer.removeListener('file:open', listener);
    ipcRenderer.emit('file:open', '/y.md');

    expect(received).toEqual(['/x.md']);
  });

  it('send 记录调用用于断言', () => {
    const { ipcRenderer } = createMockIpcBridge();

    ipcRenderer.send('app:saved-for-close');

    expect(ipcRenderer.sentMessages).toEqual([{ channel: 'app:saved-for-close', args: [] }]);
  });

  it('handlerChannels 返回已注册通道', () => {
    const { ipcMain } = createMockIpcBridge();
    ipcMain.handle('a', () => 1);
    ipcMain.handle('b', () => 2);

    expect(ipcMain.handlerChannels()).toEqual(['a', 'b']);
  });
});
