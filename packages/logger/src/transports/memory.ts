import type { ActiveLogLevel, LogRecord, LogTransport } from '../types';

export interface MemoryTransportOptions {
  /** 环形缓冲容量，默认 1000 条 */
  capacity?: number;
}

/**
 * 内存环形缓冲 Transport：保留最近 N 条日志。
 * 适用于单元测试断言、渲染进程错误采集与问题上报。
 */
export class MemoryTransport implements LogTransport {
  readonly name = 'memory';

  private readonly capacity: number;
  private records: LogRecord[] = [];

  constructor(options: MemoryTransportOptions = {}) {
    this.capacity = options.capacity ?? 1000;
  }

  log(record: LogRecord): void {
    this.records.push(record);
    if (this.records.length > this.capacity) {
      this.records.splice(0, this.records.length - this.capacity);
    }
  }

  getRecords(): readonly LogRecord[] {
    return this.records;
  }

  findByLevel(level: ActiveLogLevel): LogRecord[] {
    return this.records.filter((r) => r.level === level);
  }

  findByNamespace(namespace: string): LogRecord[] {
    return this.records.filter((r) => r.namespace === namespace || r.namespace.startsWith(`${namespace}:`));
  }

  clear(): void {
    this.records = [];
  }

  dispose(): void {
    this.clear();
  }
}
