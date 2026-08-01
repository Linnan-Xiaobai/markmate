export interface VirtualFileItem {
  name: string;
  path: string;
  isDirectory: boolean;
}

export interface VirtualReadResult {
  success: boolean;
  content?: string;
  size?: number;
  error?: string;
}

export interface VirtualWriteResult {
  success: boolean;
  error?: string;
}

export interface VirtualDirectoryResult {
  success: boolean;
  items?: VirtualFileItem[];
  truncated?: boolean;
  error?: string;
}

const DEFAULT_MAX_ITEMS = 2000;

/** 统一路径分隔符为 `/`，去掉尾部斜杠，便于 Windows/POSIX 路径混用 */
export function normalizePath(input: string): string {
  let normalized = input.replace(/\\/g, '/');
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function dirName(normalizedPath: string): string {
  const idx = normalizedPath.lastIndexOf('/');
  if (idx <= 0) return '';
  return normalizedPath.slice(0, idx);
}

/**
 * 内存虚拟文件系统，行为对齐 Electron 主进程的 fs IPC：
 * 返回 { success, ... } 结果对象而非抛异常。
 */
export class VirtualFileSystem {
  private files = new Map<string, string>();
  private dirs = new Set<string>();

  constructor(initialFiles: Record<string, string> = {}) {
    for (const [filePath, content] of Object.entries(initialFiles)) {
      this.addFile(filePath, content);
    }
  }

  addFile(filePath: string, content: string): void {
    const normalized = normalizePath(filePath);
    this.ensureParentDirs(normalized);
    this.files.set(normalized, content);
  }

  addDir(dirPath: string): void {
    const normalized = normalizePath(dirPath);
    this.ensureParentDirs(normalized);
    this.dirs.add(normalized);
  }

  removeFile(filePath: string): boolean {
    return this.files.delete(normalizePath(filePath));
  }

  exists(path: string): boolean {
    const normalized = normalizePath(path);
    return this.files.has(normalized) || this.dirs.has(normalized);
  }

  isFile(path: string): boolean {
    return this.files.has(normalizePath(path));
  }

  isDirectory(path: string): boolean {
    return this.dirs.has(normalizePath(path));
  }

  readFile(filePath: string): VirtualReadResult {
    const normalized = normalizePath(filePath);
    const content = this.files.get(normalized);
    if (content === undefined) {
      return { success: false, error: `File not found: ${filePath}` };
    }
    return { success: true, content, size: new TextEncoder().encode(content).length };
  }

  writeFile(filePath: string, content: string): VirtualWriteResult {
    const normalized = normalizePath(filePath);
    const parent = dirName(normalized);
    if (parent && !this.dirs.has(parent)) {
      return { success: false, error: `Directory not found: ${parent}` };
    }
    this.files.set(normalized, content);
    return { success: true };
  }

  /** 列出直接子项，目录在前、按名称排序；超过 maxItems 时截断 */
  readDirectory(dirPath: string, maxItems: number = DEFAULT_MAX_ITEMS): VirtualDirectoryResult {
    const normalized = normalizePath(dirPath);
    if (!this.dirs.has(normalized)) {
      return { success: false, error: `Directory not found: ${dirPath}` };
    }

    const prefix = normalized === '' ? '' : `${normalized}/`;
    const items = new Map<string, VirtualFileItem>();

    const collect = (candidate: string, isDirectory: boolean) => {
      if (!candidate.startsWith(prefix)) return;
      const rest = candidate.slice(prefix.length);
      if (rest === '' || rest.includes('/')) {
        // 更深层级：归入其直接子目录
        const childDir = rest.split('/')[0];
        if (childDir) {
          const childPath = `${prefix}${childDir}`;
          items.set(childPath, { name: childDir, path: childPath, isDirectory: true });
        }
        return;
      }
      items.set(candidate, { name: rest, path: candidate, isDirectory });
    };

    for (const dir of this.dirs) {
      if (dir !== normalized) collect(dir, true);
    }
    for (const file of this.files.keys()) {
      collect(file, false);
    }

    const sorted = Array.from(items.values()).sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    const truncated = sorted.length > maxItems;
    return {
      success: true,
      items: sorted.slice(0, maxItems),
      ...(truncated ? { truncated: true } : {}),
    };
  }

  /** 导出全部文件快照，用于断言 */
  snapshot(): Record<string, string> {
    return Object.fromEntries(this.files);
  }

  clear(): void {
    this.files.clear();
    this.dirs.clear();
  }

  private ensureParentDirs(normalizedPath: string): void {
    let current = dirName(normalizedPath);
    while (current) {
      this.dirs.add(current);
      current = dirName(current);
    }
  }
}
