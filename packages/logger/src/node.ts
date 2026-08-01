import type { Logger } from './types';

export { FileTransport } from './transports/file';
export type { FileTransportOptions } from './transports/file';

/**
 * 捕获 Node 进程级未处理异常与 Promise 拒绝，写入日志。
 * 用于 Electron 主进程启动早期挂载，避免崩溃信息丢失。
 */
export function attachProcessErrorHandlers(logger: Logger): void {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
  });
}
