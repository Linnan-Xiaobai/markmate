export interface BrowserMockOptions {
  /** matchMedia 预设匹配结果，默认 false */
  prefersDark?: boolean;
}

interface PatchRecord {
  target: object;
  key: string;
  original: unknown;
  existed: boolean;
}

function patch(target: object, key: string, value: unknown, records: PatchRecord[]): void {
  const holder = target as Record<string, unknown>;
  records.push({ target, key, original: holder[key], existed: key in holder });
  Object.defineProperty(target, key, { value, writable: true, configurable: true });
}

/**
 * 安装 jsdom 缺失的浏览器 API Mock：matchMedia、ResizeObserver、
 * IntersectionObserver、requestIdleCallback、scrollIntoView、URL.createObjectURL。
 * 幂等：已存在的原生实现不会被覆盖。返回还原函数。
 */
export function installBrowserMocks(options: BrowserMockOptions = {}): () => void {
  const records: PatchRecord[] = [];
  const prefersDark = options.prefersDark ?? false;

  if (typeof window === 'undefined') {
    return () => undefined;
  }

  if (typeof window.matchMedia !== 'function') {
    patch(window, 'matchMedia', (query: string) => ({
      matches: query.includes('dark') ? prefersDark : false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }), records);
  }

  if (typeof window.ResizeObserver !== 'function') {
    class MockResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    patch(window, 'ResizeObserver', MockResizeObserver, records);
    patch(globalThis, 'ResizeObserver', MockResizeObserver, records);
  }

  if (typeof window.IntersectionObserver !== 'function') {
    class MockIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '0px';
      readonly thresholds = [0];
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): unknown[] {
        return [];
      }
    }
    patch(window, 'IntersectionObserver', MockIntersectionObserver, records);
    patch(globalThis, 'IntersectionObserver', MockIntersectionObserver, records);
  }

  if (typeof window.requestIdleCallback !== 'function') {
    let nextHandle = 1;
    const timers = new Map<number, ReturnType<typeof setTimeout>>();
    patch(window, 'requestIdleCallback', (callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void) => {
      const handle = nextHandle++;
      const timer = setTimeout(() => {
        timers.delete(handle);
        callback({ didTimeout: false, timeRemaining: () => 50 });
      }, 0);
      timers.set(handle, timer);
      return handle;
    }, records);
    patch(window, 'cancelIdleCallback', (handle: number) => {
      const timer = timers.get(handle);
      if (timer) clearTimeout(timer);
      timers.delete(handle);
    }, records);
  }

  if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
    patch(Element.prototype, 'scrollIntoView', () => undefined, records);
  }

  if (typeof URL.createObjectURL !== 'function') {
    patch(URL, 'createObjectURL', () => 'blob:mock-url', records);
    patch(URL, 'revokeObjectURL', () => undefined, records);
  }

  let restored = false;
  return () => {
    if (restored) return;
    restored = true;
    for (const record of records.reverse()) {
      const holder = record.target as Record<string, unknown>;
      if (record.existed) {
        Object.defineProperty(record.target, record.key, {
          value: record.original,
          writable: true,
          configurable: true,
        });
      } else {
        delete holder[record.key];
      }
    }
  };
}
