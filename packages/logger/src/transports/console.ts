import type { ActiveLogLevel, LogLevel, LogRecord, LogTransport } from '../types';
import { isLevelEnabled } from '../types';
import { formatArgs, safeStringify } from '../serializer';

const ANSI_COLORS: Record<ActiveLogLevel, string> = {
  debug: '\x1b[90m', // gray
  info: '\x1b[36m', // cyan
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};
const ANSI_RESET = '\x1b[0m';

const BROWSER_COLORS: Record<ActiveLogLevel, string> = {
  debug: 'color:#9e9e9e',
  info: 'color:#2196f3',
  warn: 'color:#ff9800',
  error: 'color:#f44336',
};

const CONSOLE_METHOD: Record<ActiveLogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

export interface ConsoleTransportOptions {
  /** Transport 自身级别过滤 */
  level?: LogLevel;
  /** 是否启用颜色，默认自动检测（浏览器 %c / Node ANSI） */
  colors?: boolean;
  /** 是否输出时间戳前缀，默认 true */
  timestamps?: boolean;
}

/** 控制台 Transport：浏览器使用 %c 样式，Node 使用 ANSI 颜色 */
export class ConsoleTransport implements LogTransport {
  readonly name = 'console';
  readonly level?: LogLevel;

  private readonly colors: boolean;
  private readonly timestamps: boolean;
  private readonly isBrowser: boolean;

  constructor(options: ConsoleTransportOptions = {}) {
    if (options.level !== undefined) {
      this.level = options.level;
    }
    this.isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
    this.colors = options.colors ?? true;
    this.timestamps = options.timestamps ?? true;
  }

  log(record: LogRecord): void {
    if (this.level && !isLevelEnabled(this.level, record.level)) return;

    const time = this.timestamps ? `${new Date(record.timestamp).toISOString().slice(11, 23)} ` : '';
    const label = `${record.level.toUpperCase().padEnd(5)} [${record.namespace}]`;
    const contextText = record.context ? ` ${safeStringify(record.context)}` : '';
    const argsText = record.args.length > 0 ? ` ${formatArgs(record.args)}` : '';
    const text = `${time}${label} ${record.message}${contextText}${argsText}`;

    const method = CONSOLE_METHOD[record.level];
    const consoleFn = console[method].bind(console);

    if (!this.colors) {
      consoleFn(text);
      return;
    }

    if (this.isBrowser) {
      consoleFn(`%c${text}`, BROWSER_COLORS[record.level]);
    } else {
      consoleFn(`${ANSI_COLORS[record.level]}${text}${ANSI_RESET}`);
    }
  }
}
