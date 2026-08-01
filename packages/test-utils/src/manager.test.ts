import { describe, expect, it, vi } from 'vitest';
import { getMockManager, MockManager } from './manager';

describe('MockManager', () => {
  it('是单例', () => {
    expect(MockManager.getInstance()).toBe(getMockManager());
  });

  it('register 登记后可通过 unregister 还原', () => {
    const manager = getMockManager();
    const restore = vi.fn();

    manager.register('test-mock', restore);
    expect(manager.isRegistered('test-mock')).toBe(true);

    expect(manager.unregister('test-mock')).toBe(true);
    expect(restore).toHaveBeenCalledOnce();
    expect(manager.isRegistered('test-mock')).toBe(false);
  });

  it('同名重复注册时先还原旧 Mock', () => {
    const manager = getMockManager();
    const first = vi.fn();
    const second = vi.fn();

    manager.register('dup', first);
    manager.register('dup', second);

    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
    expect(manager.list()).toEqual(['dup']);

    manager.restoreAll();
  });

  it('restoreAll 按注册逆序还原', () => {
    const manager = getMockManager();
    const order: string[] = [];

    manager.register('a', () => order.push('a'));
    manager.register('b', () => order.push('b'));
    manager.register('c', () => order.push('c'));

    manager.restoreAll();

    expect(order).toEqual(['c', 'b', 'a']);
    expect(manager.list()).toEqual([]);
  });

  it('单个还原失败不阻断其余还原', () => {
    const manager = getMockManager();
    const good = vi.fn();

    manager.register('bad', () => {
      throw new Error('restore failed');
    });
    manager.register('good', good);

    expect(() => manager.restoreAll()).not.toThrow();
    expect(good).toHaveBeenCalledOnce();
  });

  it('unregister 不存在的名称返回 false', () => {
    expect(getMockManager().unregister('missing')).toBe(false);
  });
});
