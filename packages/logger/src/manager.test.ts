import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LogManager, resolveDefaultLevel } from './manager';
import { MemoryTransport } from './transports/memory';
import type { LogTransport } from './types';

describe('LogManager', () => {
  let manager: LogManager;

  beforeEach(() => {
    manager = LogManager.getInstance();
    manager.reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    manager.reset();
  });

  it('是单例', () => {
    expect(LogManager.getInstance()).toBe(manager);
  });

  it('configure 替换 Transport 列表并 dispose 旧 Transport', () => {
    const dispose = vi.fn();
    const oldTransport: LogTransport = { name: 'old', log: vi.fn(), dispose };
    manager.configure({ transports: [oldTransport] });

    const memory = new MemoryTransport();
    manager.configure({ transports: [memory] });

    expect(dispose).toHaveBeenCalledOnce();
    expect(manager.getTransports()).toEqual([memory]);
  });

  it('addTransport 按名称去重', () => {
    const first = new MemoryTransport();
    const second = new MemoryTransport();
    manager.configure({ transports: [] });
    manager.addTransport(first);
    manager.addTransport(second);

    expect(manager.getTransports()).toEqual([second]);
  });

  it('removeTransport 按名称移除', () => {
    const memory = new MemoryTransport();
    manager.configure({ transports: [memory] });
    manager.removeTransport('memory');

    expect(manager.getTransports()).toEqual([]);
  });

  it('单个 Transport 抛异常不影响其他 Transport', () => {
    const broken: LogTransport = {
      name: 'broken',
      log: () => {
        throw new Error('transport exploded');
      },
    };
    const memory = new MemoryTransport();
    manager.configure({ level: 'debug', transports: [broken, memory] });

    expect(() => manager.getLogger('app').info('hello')).not.toThrow();
    expect(memory.getRecords()).toHaveLength(1);
  });

  it('Transport 自身级别优先于全局级别进行过滤', () => {
    const errorRecords: string[] = [];
    const errorOnly: LogTransport = {
      name: 'errors',
      level: 'error',
      log: (record) => errorRecords.push(record.message),
    };
    const all = new MemoryTransport();
    manager.configure({ level: 'debug', transports: [errorOnly, all] });
    const logger = manager.getLogger('app');

    logger.warn('w');
    logger.error('e');

    expect(errorRecords).toEqual(['e']);
    expect(all.getRecords().map((r) => r.level)).toEqual(['warn', 'error']);
  });

  it('级别设为 silent 时完全静默', () => {
    const memory = new MemoryTransport();
    manager.configure({ level: 'silent', transports: [memory] });

    manager.getLogger('app').error('e');
    expect(memory.getRecords()).toHaveLength(0);
  });
});

describe('resolveDefaultLevel', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    try {
      localStorage.removeItem('markmate:log-level');
    } catch {
      // ignore
    }
  });

  it('优先读取环境变量 MARKMATE_LOG_LEVEL', () => {
    vi.stubEnv('MARKMATE_LOG_LEVEL', 'error');
    expect(resolveDefaultLevel()).toBe('error');
  });

  it('环境变量非法时回退到默认级别', () => {
    vi.stubEnv('MARKMATE_LOG_LEVEL', 'verbose');
    expect(resolveDefaultLevel()).toBe('debug');
  });

  it('无环境变量时读取 localStorage', () => {
    vi.stubEnv('MARKMATE_LOG_LEVEL', '');
    localStorage.setItem('markmate:log-level', 'warn');
    expect(resolveDefaultLevel()).toBe('warn');
  });

  it('生产环境默认 info', () => {
    vi.stubEnv('MARKMATE_LOG_LEVEL', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(resolveDefaultLevel()).toBe('info');
  });
});
