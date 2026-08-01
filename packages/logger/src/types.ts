/** 日志级别，silent 用于完全关闭日志输出 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** 可输出的日志级别（不含 silent） */
export type ActiveLogLevel = Exclude<LogLevel, 'silent'>;

/** 附加在日志记录上的结构化上下文 */
export type LogContext = Record<string, unknown>;

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: Number.POSITIVE_INFINITY,
};

/** 判断 target 级别在当前级别设置下是否应输出 */
export function isLevelEnabled(current: LogLevel, target: ActiveLogLevel): boolean {
  return LOG_LEVEL_PRIORITY[target] >= LOG_LEVEL_PRIORITY[current];
}

/** 一条结构化日志记录，由 Logger 产生并分发给各 Transport */
export interface LogRecord {
  level: ActiveLogLevel;
  namespace: string;
  message: string;
  timestamp: number;
  context?: LogContext;
  /** 消息之后的额外参数（Error、对象等），由 Transport 负责格式化 */
  args: unknown[];
}

/** 日志输出目标（控制台 / 文件 / 内存缓冲等） */
export interface LogTransport {
  readonly name: string;
  /** Transport 自身的级别过滤，未设置时跟随全局级别 */
  readonly level?: LogLevel;
  log(record: LogRecord): void;
  flush?(): void | Promise<void>;
  dispose?(): void;
}

export interface Logger {
  readonly namespace: string;
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  /** 创建子日志器，命名空间形如 "parent:child" */
  child(namespace: string): Logger;
  /** 创建绑定固定上下文的日志器 */
  withContext(context: LogContext): Logger;
  isLevelEnabled(level: ActiveLogLevel): boolean;
}
