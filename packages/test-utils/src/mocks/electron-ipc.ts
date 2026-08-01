type IpcHandler = (event: { sender: unknown }, ...args: unknown[]) => unknown;
type IpcListener = (event: { sender: unknown }, ...args: unknown[]) => void;

export interface MockIpcMain {
  /** 注册 invoke 处理器，同 electron.ipcMain.handle */
  handle(channel: string, handler: IpcHandler): void;
  removeHandler(channel: string): void;
  /** 已注册处理器的通道列表 */
  handlerChannels(): string[];
}

export interface MockIpcRenderer {
  /** 触发对应通道的主进程处理器；未注册时 reject，行为对齐真实 IPC */
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
  send(channel: string, ...args: unknown[]): void;
  on(channel: string, listener: IpcListener): void;
  removeListener(channel: string, listener: IpcListener): void;
  /** 模拟主进程 → 渲染进程的消息推送（webContents.send） */
  emit(channel: string, ...args: unknown[]): void;
  /** send() 调用记录，用于断言 */
  readonly sentMessages: { channel: string; args: unknown[] }[];
}

export interface MockIpcBridge {
  ipcMain: MockIpcMain;
  ipcRenderer: MockIpcRenderer;
}

/**
 * 创建联通的 ipcMain/ipcRenderer Mock 对，用于在不启动 Electron 的情况下
 * 对主进程 IPC 处理器做集成测试。
 */
export function createMockIpcBridge(): MockIpcBridge {
  const handlers = new Map<string, IpcHandler>();
  const listeners = new Map<string, Set<IpcListener>>();
  const sentMessages: { channel: string; args: unknown[] }[] = [];
  const fakeEvent = { sender: {} };

  const ipcMain: MockIpcMain = {
    handle(channel: string, handler: IpcHandler): void {
      handlers.set(channel, handler);
    },
    removeHandler(channel: string): void {
      handlers.delete(channel);
    },
    handlerChannels(): string[] {
      return Array.from(handlers.keys());
    },
  };

  const ipcRenderer: MockIpcRenderer = {
    async invoke(channel: string, ...args: unknown[]): Promise<unknown> {
      const handler = handlers.get(channel);
      if (!handler) {
        throw new Error(`No handler registered for channel: ${channel}`);
      }
      return handler(fakeEvent, ...args);
    },
    send(channel: string, ...args: unknown[]): void {
      sentMessages.push({ channel, args });
    },
    on(channel: string, listener: IpcListener): void {
      if (!listeners.has(channel)) listeners.set(channel, new Set());
      listeners.get(channel)?.add(listener);
    },
    removeListener(channel: string, listener: IpcListener): void {
      listeners.get(channel)?.delete(listener);
    },
    emit(channel: string, ...args: unknown[]): void {
      for (const listener of listeners.get(channel) ?? []) {
        listener(fakeEvent, ...args);
      }
    },
    sentMessages,
  };

  return { ipcMain, ipcRenderer };
}
