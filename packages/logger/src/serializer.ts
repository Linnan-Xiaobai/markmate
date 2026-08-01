const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 2048;

/** 安全序列化任意值：处理 Error、循环引用、BigInt、函数与深层嵌套 */
export function serializeValue(value: unknown, depth = 0, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'function') return `[Function ${(value as { name?: string }).name ?? 'anonymous'}]`;
  if (typeof value === 'symbol') return value.toString();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (depth >= MAX_DEPTH) return '[MaxDepth]';

  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, depth + 1, seen));
  }

  if (value instanceof Map) {
    const out: Record<string, unknown> = {};
    for (const [key, val] of value.entries()) {
      out[String(key)] = serializeValue(val, depth + 1, seen);
    }
    return out;
  }

  if (value instanceof Set) {
    return Array.from(value).map((item) => serializeValue(item, depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = serializeValue(val, depth + 1, seen);
  }
  return out;
}

/** JSON.stringify 的安全版本，永不抛异常 */
export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(serializeValue(value)) ?? String(value);
  } catch {
    try {
      return String(value);
    } catch {
      return '[Unserializable]';
    }
  }
}

/** 将日志附加参数格式化为单行文本 */
export function formatArgs(args: unknown[]): string {
  return args
    .map((arg) => (typeof arg === 'string' ? arg : safeStringify(arg)))
    .join(' ');
}
