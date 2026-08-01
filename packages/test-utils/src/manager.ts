export type MockRestoreFn = () => void;

interface MockRegistration {
  name: string;
  restore: MockRestoreFn;
}

/**
 * 统一 Mock 生命周期管理器。
 * 所有 Mock（window.markmate、浏览器 API、定时器等）通过 register 登记，
 * 在测试结束（afterEach → restoreAll）时按注册逆序统一还原，避免跨用例污染。
 */
export class MockManager {
  private static instance: MockManager | null = null;

  private registrations: MockRegistration[] = [];

  private constructor() {}

  static getInstance(): MockManager {
    if (!MockManager.instance) {
      MockManager.instance = new MockManager();
    }
    return MockManager.instance;
  }

  /**
   * 登记一个 Mock 及其还原函数。
   * 同名 Mock 重复登记时先还原旧的，保证同一测试中对同一目标只保留最新 Mock。
   */
  register(name: string, restore: MockRestoreFn): MockRestoreFn {
    if (this.isRegistered(name)) {
      this.unregister(name);
    }
    this.registrations.push({ name, restore });
    return restore;
  }

  /** 还原并移除指定 Mock，返回是否成功 */
  unregister(name: string): boolean {
    const index = this.registrations.findIndex((r) => r.name === name);
    if (index === -1) return false;
    const registration = this.registrations[index];
    this.registrations.splice(index, 1);
    if (registration) {
      this.safeRestore(registration);
    }
    return true;
  }

  isRegistered(name: string): boolean {
    return this.registrations.some((r) => r.name === name);
  }

  list(): string[] {
    return this.registrations.map((r) => r.name);
  }

  /** 按注册逆序还原全部 Mock；单个还原失败不阻断其余还原 */
  restoreAll(): void {
    const pending = this.registrations.reverse();
    this.registrations = [];
    for (const registration of pending) {
      this.safeRestore(registration);
    }
  }

  private safeRestore(registration: MockRegistration): void {
    try {
      registration.restore();
    } catch {
      // 还原异常不应影响测试拆解流程
    }
  }
}

export function getMockManager(): MockManager {
  return MockManager.getInstance();
}
