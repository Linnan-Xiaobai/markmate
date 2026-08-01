import { describe, expect, it } from 'vitest';
import { formatArgs, safeStringify, serializeValue } from './serializer';

describe('serializer', () => {
  it('序列化 Error 为结构化对象', () => {
    const error = new Error('boom');
    const result = serializeValue(error) as { name: string; message: string; stack?: string };

    expect(result.name).toBe('Error');
    expect(result.message).toBe('boom');
    expect(result.stack).toContain('boom');
  });

  it('处理循环引用', () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;

    expect(safeStringify(obj)).toContain('[Circular]');
  });

  it('截断超长字符串', () => {
    const long = 'x'.repeat(5000);
    const result = serializeValue(long) as string;

    expect(result.length).toBeLessThan(5000);
  });

  it('序列化 Map 与 Set', () => {
    const map = new Map([['k', 1]]);
    const set = new Set([1, 2]);

    expect(serializeValue(map)).toEqual({ k: 1 });
    expect(serializeValue(set)).toEqual([1, 2]);
  });

  it('BigInt 与函数降级为字符串', () => {
    expect(serializeValue(BigInt(10))).toBe('10');
    expect(serializeValue(function namedFn() {})).toBe('[Function namedFn]');
  });

  it('formatArgs 拼接字符串与对象', () => {
    expect(formatArgs(['failed', { file: 'a.md' }])).toBe('failed {"file":"a.md"}');
  });

  it('safeStringify 对异常输入不抛错', () => {
    const weird = { toJSON: () => { throw new Error('nope'); } };
    expect(() => safeStringify(weird)).not.toThrow();
  });
});
