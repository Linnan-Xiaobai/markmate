import type { ActiveLogLevel, LogContext, Logger, LogRecord, LogTransport, LogLevel } from './types';
import { isLevelEnabled } from './types';
import { ConsoleTransport } from './transports/console';

export interface LogManagerConfig {
  level?: LogLevel;
  /** 传入则整体替换现有 Transport 列表（旧的会被 dispose） */
  transports?: LogTransport[];
}

/** 从运行环境解析默认日志级别：Node 取 MARKMATE_LOG_LEVEL，浏览器取 localStorage */
export function resolveDefaultLevel(): LogLevel {
  const allowed: LogLevel[] = ['debug', 'info', 'warn', 'error', 'silent'];
  let raw: string | null | undefined;

  if (typeof process !== 'undefined' && process.env) {
    raw = process.env.MARKMATE_LOG_LEVEL;
  }
  if (!raw && typeof localStorage !== 'undefined') {
    try {
      raw = localStorage.getItem('markmate:log-level');
    } catch {
      // 隐私模式等场景下 localStorage 可能不可用
    }
  }

  const normalized = raw?.toLowerCase() as LogLevel | undefined;
  if (normalized && allowed.includes(normalized)) return normalized;

  const isProd = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  return isProd ? 'info' : 'debug';
}

/** 全局日志管理器：维护级别与 Transport 列表，统一分发日志记录 */
export class LogManager {
  private static instance: LogManager | null = null;

  private level: LogLevel;
  private transports: LogTransport[];

  private constructor() {
    this.level = resolveDefaultLevel();
    this.transports = [new ConsoleTransport()];
  }

  static getInstance(): LogManager {
    if (!LogManager.instance) {
      LogManager.instance = new LogManager();
    }
    return LogManager.instance;
  }

  configure(config: LogManagerConfig): void {
    if (config.level !== undefined) {
      this.level = config.level;
    }
    if (config.transports) {
      for (const transport of this.transports) {
        try {
          transport.dispose?.();
        } catch {
          // 忽略 dispose 异常，避免影响配置切换
        }
      }
      this.transports = [...config.transports];
    }
  }

  getLevel(): LogLevel {
    return this.level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  addTransport(transport: LogTransport): void {
    this.transports = this.transports.filter((t) => t.name !== transport.name);
    this.transports.push(transport);
  }

  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name);
  }

  getTransports(): readonly LogTransport[] {
    return this.transports;
  }

  getLogger(namespace: string): Logger {
    return new NamespacedLogger(this, namespace);
  }

  isEnabled(level: ActiveLogLevel): boolean {
    return isLevelEnabled(this.level, level);
  }

  /** 全局级别 + Transport 自身级别双重过滤后分发；单个 Transport 异常不影响其他 */
  write(record: LogRecord): void {
    if (!this.isEnabled(record.level)) return;
    for (const transport of this.transports) {
      if (transport.level && !isLevelEnabled(transport.level, record.level)) continue;
      try {
        transport.log(record);
      } catch {
        // Transport 自身异常不应打断业务与其他 Transport
      }
    }
  }

  /** 恢复默认配置，主要用于测试 */
  reset(): void {
    this.configure({ level: resolveDefaultLevel(), transports: [new ConsoleTransport()] });
  }
}

class NamespacedLogger implements Logger {
  constructor(
    private readonly manager: LogManager,
    readonly namespace: string,
    private readonly baseContext?: LogContext
  ) {}

  private log(level: ActiveLogLevel, message: string, args: unknown[]): void {
    if (!this.manager.isEnabled(level)) return;
    const record: LogRecord = {
      level,
      namespace: this.namespace,
      message,
      timestamp: Date.now(),
      args,
    };
    if (this.baseContext) {
      record.context = this.baseContext;
    }
    this.manager.write(record);
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, args);
  }

  child(namespace: string): Logger {
    return new NamespacedLogger(this.manager, `${this.namespace}:${namespace}`, this.baseContext);
  }

  withContext(context: LogContext): Logger {
    return new NamespacedLogger(this.manager, this.namespace, { ...this.baseContext, ...context });
  }

  isLevelEnabled(level: ActiveLogLevel): boolean {
    return this.manager.isEnabled(level);
  }
}

/** 便捷入口：获取一个命名空间日志器 */
export function createLogger(namespace: string): Logger {
  return LogManager.getInstance().getLogger(namespace);
}
