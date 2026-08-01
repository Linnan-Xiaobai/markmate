import { beforeEach, describe, expect, it } from 'vitest';
import { LogManager } from './manager';
import { MemoryTransport } from './transports/memory';
import { isLevelEnabled } from './types';

describe('Logger', () => {
  let manager: LogManager;
  let memory: MemoryTransport;

  beforeEach(() => {
    manager = LogManager.getInstance();
    memory = new MemoryTransport();
    manager.configure({ level: 'debug', transports: [memory] });
  });

  it('按级别过滤日志', () => {
    manager.setLevel('warn');
    const logger = manager.getLogger('test');

    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(memory.getRecords().map((r) => r.level)).toEqual(['warn', 'error']);
  });

  it('记录命名空间与消息', () => {
    const logger = manager.getLogger('config');
    logger.info('loaded');

    const record = memory.getRecords()[0];
    expect(record?.namespace).toBe('config');
    expect(record?.message).toBe('loaded');
    expect(record?.timestamp).toBeGreaterThan(0);
  });

  it('子日志器拼接命名空间', () => {
    const logger = manager.getLogger('app').child('fs');
    logger.warn('slow io');

    expect(logger.namespace).toBe('app:fs');
    expect(memory.getRecords()[0]?.namespace).toBe('app:fs');
  });

  it('withContext 附加结构化上下文且可合并', () => {
    const logger = manager.getLogger('app').withContext({ module: 'config' });
    const scoped = logger.withContext({ version: 2 });

    scoped.error('failed');
    const record = memory.getRecords()[0];
    expect(record?.context).toEqual({ module: 'config', version: 2 });
  });

  it('附加参数原样保留在记录中', () => {
    const error = new Error('boom');
    manager.getLogger('app').error('failed', error, { file: 'a.md' });

    const record = memory.getRecords()[0];
    expect(record?.args[0]).toBe(error);
    expect(record?.args[1]).toEqual({ file: 'a.md' });
  });

  it('isLevelEnabled 与全局级别联动', () => {
    manager.setLevel('info');
    const logger = manager.getLogger('app');

    expect(logger.isLevelEnabled('debug')).toBe(false);
    expect(logger.isLevelEnabled('info')).toBe(true);
    expect(isLevelEnabled('silent', 'error')).toBe(false);
  });
});

describe('MemoryTransport', () => {
  it('超出容量时丢弃最旧记录', () => {
    const memory = new MemoryTransport({ capacity: 3 });
    const manager = LogManager.getInstance();
    manager.configure({ level: 'debug', transports: [memory] });
    const logger = manager.getLogger('ring');

    for (let i = 0; i < 5; i++) {
      logger.info(`msg-${i}`);
    }

    expect(memory.getRecords().map((r) => r.message)).toEqual(['msg-2', 'msg-3', 'msg-4']);
  });

  it('支持按级别与命名空间查询', () => {
    const memory = new MemoryTransport();
    const manager = LogManager.getInstance();
    manager.configure({ level: 'debug', transports: [memory] });

    manager.getLogger('a').child('b').warn('w1');
    manager.getLogger('c').error('e1');

    expect(memory.findByLevel('error')).toHaveLength(1);
    expect(memory.findByNamespace('a')).toHaveLength(1);
    expect(memory.findByNamespace('a')[0]?.message).toBe('w1');
  });
});
