import fs from 'node:fs';
import path from 'node:path';
import type { LogLevel, LogRecord, LogTransport } from '../types';
import { isLevelEnabled } from '../types';
import { formatArgs, safeStringify } from '../serializer';

export interface FileTransportOptions {
  /** 日志目录，不存在时自动创建 */
  dir: string;
  /** 日志文件基础名，默认 "app"，输出 <fileName>.log */
  fileName?: string;
  /** 单文件最大字节数，超过后轮转，默认 5MB */
  maxSizeBytes?: number;
  /** 保留的历史文件数量，默认 3 */
  maxFiles?: number;
  /** Transport 自身级别过滤 */
  level?: LogLevel;
}

/**
 * 文件 Transport（仅 Node/Electron 主进程）：JSONL 格式逐行写入，按大小轮转。
 * 使用同步追加写入，保证主进程崩溃前日志不丢失。
 */
export class FileTransport implements LogTransport {
  readonly name = 'file';
  readonly level?: LogLevel;

  private readonly dir: string;
  private readonly fileName: string;
  private readonly maxSizeBytes: number;
  private readonly maxFiles: number;
  private initialized = false;

  constructor(options: FileTransportOptions) {
    this.dir = options.dir;
    this.fileName = options.fileName ?? 'app';
    this.maxSizeBytes = options.maxSizeBytes ?? 5 * 1024 * 1024;
    this.maxFiles = options.maxFiles ?? 3;
    if (options.level !== undefined) {
      this.level = options.level;
    }
  }

  private get logPath(): string {
    return path.join(this.dir, `${this.fileName}.log`);
  }

  private ensureDir(): void {
    if (this.initialized) return;
    fs.mkdirSync(this.dir, { recursive: true });
    this.initialized = true;
  }

  log(record: LogRecord): void {
    if (this.level && !isLevelEnabled(this.level, record.level)) return;
    try {
      this.ensureDir();
      this.rotateIfNeeded();
      const line = JSON.stringify({
        time: new Date(record.timestamp).toISOString(),
        level: record.level,
        ns: record.namespace,
        msg: record.message,
        ...(record.context ? { ctx: record.context } : {}),
        ...(record.args.length > 0 ? { args: record.args.map((a) => safeStringify(a)) } : {}),
      });
      fs.appendFileSync(this.logPath, `${line}\n`, 'utf-8');
    } catch (error) {
      // 文件写入失败降级到控制台，避免递归调用日志器
      console.error('[FileTransport] write failed:', error);
    }
  }

  private rotateIfNeeded(): void {
    let size = 0;
    try {
      size = fs.statSync(this.logPath).size;
    } catch {
      return; // 文件不存在，无需轮转
    }
    if (size < this.maxSizeBytes) return;

    // 依次移位：app.2.log -> app.3.log，app.1.log -> app.2.log，app.log -> app.1.log
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const from = path.join(this.dir, `${this.fileName}.${i}.log`);
      const to = path.join(this.dir, `${this.fileName}.${i + 1}.log`);
      if (fs.existsSync(from)) {
        fs.renameSync(from, to);
      }
    }
    const oldest = path.join(this.dir, `${this.fileName}.${this.maxFiles}.log`);
    if (fs.existsSync(oldest)) {
      fs.rmSync(oldest, { force: true });
    }
    fs.renameSync(this.logPath, path.join(this.dir, `${this.fileName}.1.log`));
  }

  /** 供测试与故障排查使用：读取当前日志文件内容 */
  formatRecord(record: LogRecord): string {
    return `${new Date(record.timestamp).toISOString()} ${record.level} [${record.namespace}] ${record.message} ${formatArgs(record.args)}`.trim();
  }
}
