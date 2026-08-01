# Markdown 文档阅读器 - 架构规划文档

**版本**: v1.0.0  
**日期**: 2026-07-31  
**状态**: 规划阶段  
**参考项目**: Typora, Obsidian, MarkText, VS Code, Milkdown, Tiptap

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术选型](#2-技术选型)
3. [系统架构设计](#3-系统架构设计)
4. [核心模块设计](#4-核心模块设计)
5. [数据模型设计](#5-数据模型设计)
6. [API 接口设计](#6-api-接口设计)
7. [性能设计](#7-性能设计)
8. [安全设计](#8-安全设计)
9. [扩展性设计](#9-扩展性设计)
10. [测试策略](#10-测试策略)
11. [模块化架构](#11-模块化架构)
12. [UI 设计令牌系统](#12-ui-设计令牌系统)
13. [用户交互体验优化](#13-用户交互体验优化)

---

## 1. 项目概述

### 1.1 产品定位

MarkMate 是一款专业的 Markdown 文档阅读器与编辑器，融合 Typora 的所见即所得编辑体验、Obsidian 的知识管理能力，以及 VS Code 的扩展性，为用户提供高性能、可扩展的文档处理解决方案。

### 1.2 核心目标

- **高性能**: 支持百万字大文档流畅编辑与渲染
- **所见即所得**: 提供 Typora 式的沉浸式写作体验
- **双模式编辑**: 支持源码模式与 WYSIWYG 模式无缝切换
- **插件生态**: 提供完善的插件系统，支持功能扩展
- **跨平台**: 支持 Web、Windows、macOS、Linux
- **安全可靠**: 严格的 XSS 防护，本地优先数据存储

### 1.3 功能矩阵

| 功能分类 | 核心功能 | 优先级 |
|---------|---------|--------|
| 编辑体验 | WYSIWYG 编辑、源码编辑、分屏预览 | P0 |
| Markdown 支持 | GFM、表格、任务列表、脚注、数学公式 | P0 |
| 代码支持 | 语法高亮、代码块复制、行号显示 | P0 |
| 图表支持 | Mermaid 流程图、时序图、甘特图 | P1 |
| 导出功能 | HTML、PDF、Word、图片导出 | P1 |
| 文件管理 | 目录树、标签、收藏、最近文件 | P1 |
| 搜索功能 | 全文搜索、正则搜索、替换 | P1 |
| 双向链接 | Wiki 链接、反向链接、关系图谱 | P2 |
| 协作功能 | 实时协同编辑、评论 | P2 |
| AI 辅助 | 智能补全、内容生成、翻译 | P3 |

---

## 2. 技术选型

### 2.1 技术栈总览

```
┌─────────────────────────────────────────────────────────────┐
│                        应用层                                │
│  Electron (Desktop)  │  Web App  │  PWA (Mobile Web)       │
├─────────────────────────────────────────────────────────────┤
│                        UI 框架层                             │
│     React 18  +  TypeScript 5  +  Zustand (State)           │
│     Tailwind CSS  +  Radix UI  +  Shadcn/ui                 │
├─────────────────────────────────────────────────────────────┤
│                        编辑器核心                            │
│  ┌──────────────────┐  ┌──────────────────────────────┐     │
│  │  CodeMirror 6    │  │  ProseMirror + Tiptap 2      │     │
│  │  (源码模式)      │  │  (WYSIWYG 模式)              │     │
│  └──────────────────┘  └──────────────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                      Markdown 处理层                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Unified + Remark + Rehype (AST 处理管道)            │    │
│  │  ├─ remark-gfm: GFM 支持                            │    │
│  │  ├─ remark-math + rehype-katex: 数学公式            │    │
│  │  ├─ rehype-shiki: 语法高亮                          │    │
│  │  ├─ rehype-sanitize: XSS 防护                       │    │
│  │  └─ remark-mermaid: Mermaid 图表                    │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                        基础设施层                            │
│  IndexedDB/LocalStorage  │  Node.js fs (Electron)          │
│  Web Workers  │  WebAssembly (性能敏感模块)                │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心依赖选型说明

| 技术领域 | 选型 | 选型理由 |
|---------|------|---------|
| UI 框架 | React 18 | 生态成熟，并发渲染适合大文档 |
| 类型系统 | TypeScript 5 | 类型安全，更好的开发体验 |
| 状态管理 | Zustand | 轻量、简单、适合编辑器复杂状态 |
| 源码编辑器 | CodeMirror 6 | 性能优异，扩展性强，支持大文档 |
| WYSIWYG 编辑器 | ProseMirror + Tiptap 2 | 结构化文档模型，协同编辑支持好 |
| Markdown 解析 | Unified + Remark | AST 驱动，插件生态丰富(300+插件) |
| 语法高亮 | Shiki | 基于 TextMate 语法，准确度高 |
| 数学公式 | KaTeX | 性能优于 MathJax，渲染速度快 |
| 图表渲染 | Mermaid | 业界标准，支持多种图表类型 |
| 安全防护 | DOMPurify + rehype-sanitize | 双重 XSS 防护 |
| 桌面端 | Electron 28+ | 跨平台，Node.js 生态访问本地文件 |
| 构建工具 | Vite 5 | 开发体验好，构建速度快 |
| 测试框架 | Vitest + Playwright | 单元测试 + E2E 测试 |

### 2.3 为什么不选择其他方案

| 候选方案 | 排除原因 |
|---------|---------|
| Slate.js | 边界问题多，协同编辑支持弱 |
| Quill | 扩展性有限，自定义 Markdown 语法困难 |
| marked/markdown-it | 无 AST 中间层，复杂转换和 lint 困难 |
| Monaco Editor | 过于重量，作为源码编辑器冗余 |
| Vue 3 | 团队 React 技术栈更成熟，编辑器生态 React 更好 |
| Tauri | 生态不如 Electron 成熟，Node.js API 访问不便 |

---

## 3. 系统架构设计

### 3.1 总体架构

采用分层架构 + 插件化设计，确保关注点分离和可扩展性：

```
┌─────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │  Editor UI  │  │  File Tree   │  │  Preview / Export    │    │
│  └─────────────┘  └──────────────┘  └──────────────────────┘    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │   Search    │  │   Outline    │  │  Settings / Themes   │    │
│  └─────────────┘  └──────────────┘  └──────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                        Application Layer                         │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ EditorManager   │  │ DocumentMgr  │  │  PluginManager   │    │
│  │ (双模式切换)    │  │ (文件管理)   │  │  (插件生命周期)  │    │
│  └─────────────────┘  └──────────────┘  └──────────────────┘    │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ ExportManager   │  │ SearchIndex  │  │  HistoryManager  │    │
│  │ (多格式导出)    │  │ (全文搜索)   │  │  (撤销/重做)     │    │
│  └─────────────────┘  └──────────────┘  └──────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                          Core Layer                              │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ MarkdownParser  │  │  Renderer    │  │  SchemaRegistry  │    │
│  │ (AST 解析/序列化)│  │ (HTML渲染)   │  │  (自定义语法)    │    │
│  └─────────────────┘  └──────────────┘  └──────────────────┘    │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ ExtensionHost   │  │   ThemeEng   │  │  SecuritySandbox │    │
│  │ (插件沙箱)      │  │ (主题引擎)   │  │  (安全隔离)      │    │
│  └─────────────────┘  └──────────────┘  └──────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                         │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │ FileSystemAPI   │  │ StorageAPI   │  │  WorkerPool      │    │
│  │ (文件系统抽象)  │  │ (本地存储)   │  │  (Web Worker池)  │    │
│  └─────────────────┘  └──────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 双模式编辑架构

编辑器支持无缝切换两种编辑模式：

```
┌─────────────────────────────────────────────────────────┐
│                    ModeController                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  状态机:  idle → sourceMode → wysiwygMode → ...   │  │
│  │  数据同步:  Markdown ↔ ProseMirror Doc             │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
     ┌─────────▼─────────┐     ┌──────────▼──────────┐
     │  SourceMode       │     │  WYSIWYGMode         │
     │  (CodeMirror 6)   │     │  (ProseMirror/Tiptap)│
     │  - 语法高亮       │     │  - 实时渲染          │
     │  - 快捷键         │     │  - 内联编辑          │
     │  - 代码折叠       │     │  - 表格编辑          │
     │  - 括号匹配       │     │  - 图片拖拽          │
     └───────────────────┘     └─────────────────────┘
               │                          │
               └──────────┬───────────────┘
                          │
              ┌───────────▼────────────┐
              │   Document Model       │
              │   (Unified mdast AST)  │
              │   - 单一真相源         │
              │   - 双向转换           │
              └────────────────────────┘
```

**模式切换流程**:
1. 源码 → WYSIWYG: Markdown → Remark 解析为 mdast → mdast 转换为 ProseMirror Node
2. WYSIWYG → 源码: ProseMirror Node → 转换为 mdast → Remark Stringify 为 Markdown

### 3.3 渲染流水线

Markdown 内容经过多层处理管道渲染为最终 HTML：

```
Markdown Source
     │
     ▼
┌──────────────┐
│ remark-parse │───► mdast (Markdown AST)
└──────────────┘
     │
     ├──────────────────────────────────┐
     │                                  │
     ▼                                  ▼
┌──────────────────┐           ┌────────────────────┐
│ remark-gfm       │           │ remark-math        │
│ (表格/任务列表)  │           │ (数学公式)         │
└──────────────────┘           └────────────────────┘
     │                                  │
     └──────────────┬───────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ 自定义 remark 插件    │
         │ (frontmatter 等)     │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ remark-rehype        │
         │ mdast → hast         │
         └──────────────────────┘
                    │
     ┌──────────────┴────────────────┐
     │                               │
     ▼                               ▼
┌───────────────┐            ┌──────────────────┐
│ rehype-katex  │            │ rehype-shiki     │
│ (公式渲染)    │            │ (代码高亮)       │
└───────────────┘            └──────────────────┘
     │                               │
     └──────────────┬────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ rehype-mermaid       │
         │ (Mermaid 图表)      │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ rehype-sanitize      │
         │ (XSS 安全清洗)       │
         └──────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ rehype-stringify     │
         │ hast → HTML String   │
         └──────────────────────┘
                    │
                    ▼
              Sanitized HTML
                    │
                    ▼
         ┌──────────────────────┐
         │ React 组件渲染        │
         │ (自定义组件覆盖)     │
         └──────────────────────┘
                    │
                    ▼
               Rendered UI
```

---

## 4. 核心模块设计

### 4.1 目录结构

```
markmate/
├── packages/
│   ├── core/                      # 核心引擎（无 UI 依赖）
│   │   ├── src/
│   │   │   ├── parser/            # Markdown 解析器
│   │   │   ├── renderer/          # HTML 渲染器
│   │   │   ├── schema/            # 文档 Schema
│   │   │   ├── plugins/           # 核心插件系统
│   │   │   ├── history/           # 历史记录管理
│   │   │   └── utils/             # 工具函数
│   │   └── package.json
│   │
│   ├── editor/                    # 编辑器组件
│   │   ├── src/
│   │   │   ├── source-mode/       # 源码模式（CodeMirror）
│   │   │   ├── wysiwyg-mode/      # WYSIWYG模式（Tiptap）
│   │   │   ├── mode-switcher/     # 模式切换控制器
│   │   │   ├── toolbar/           # 工具栏
│   │   │   ├── shortcuts/         # 快捷键系统
│   │   │   └── components/        # UI 组件
│   │   └── package.json
│   │
│   ├── renderer/                  # 渲染器组件
│   │   ├── src/
│   │   │   ├── components/        # React 渲染组件
│   │   │   │   ├── code-block/
│   │   │   │   ├── math/
│   │   │   │   ├── mermaid/
│   │   │   │   ├── table/
│   │   │   │   └── image/
│   │   │   ├── themes/            # 主题样式
│   │   │   └── styles/            # 默认样式
│   │   └── package.json
│   │
│   ├── file-system/               # 文件系统抽象
│   │   ├── src/
│   │   │   ├── fs-interface.ts    # 统一文件系统接口
│   │   │   ├── local-fs.ts        # 本地文件系统（Electron）
│   │   │   ├── browser-fs.ts      # 浏览器文件系统（File API）
│   │   │   └── virtual-fs.ts      # 虚拟文件系统（测试用）
│   │   └── package.json
│   │
│   ├── search/                    # 搜索模块
│   │   ├── src/
│   │   │   ├── indexer.ts         # 全文索引（FlexSearch）
│   │   │   ├── searcher.ts        # 搜索引擎
│   │   │   └── worker.ts          # Web Worker 后台索引
│   │   └── package.json
│   │
│   ├── export/                    # 导出模块
│   │   ├── src/
│   │   │   ├── html-exporter.ts
│   │   │   ├── pdf-exporter.ts    # Puppeteer/打印
│   │   │   └── docx-exporter.ts   # pandoc/自定义
│   │   └── package.json
│   │
│   └── extension-host/            # 插件宿主
│       ├── src/
│       │   ├── sandbox.ts         # 插件沙箱（iframe/Worker）
│       │   ├── api.ts             # 插件 API 暴露
│       │   └── registry.ts        # 插件注册中心
│       └── package.json
│
├── apps/
│   ├── web/                       # Web 应用
│   └── desktop/                   # Electron 桌面应用
│
├── docs/                          # 文档
├── examples/                      # 示例插件
└── tests/                         # 集成测试
```

### 4.2 核心模块接口定义

#### 4.2.1 MarkdownParser 接口

```typescript
// packages/core/src/parser/types.ts
export interface MarkdownParser {
  /**
   * 解析 Markdown 为 mdast
   */
  parse(markdown: string): Root;

  /**
   * 将 mdast 序列化为 Markdown
   */
  stringify(ast: Root): string;

  /**
   * Markdown 转 HTML
   */
  toHTML(markdown: string, options?: RenderOptions): Promise<string>;

  /**
   * 增量解析（用于大文档分片处理）
   */
  parseIncremental(chunks: string[]): AsyncGenerator<Root>;

  /**
   * 注册自定义语法插件
   */
  use(plugin: RemarkPlugin | RehypePlugin): void;
}
```

#### 4.2.2 EditorManager 接口

```typescript
// packages/editor/src/types.ts
export type EditorMode = 'source' | 'wysiwyg' | 'split';

export interface EditorState {
  mode: EditorMode;
  content: string;
  cursor: Position;
  selection: Range | null;
  isDirty: boolean;
}

export interface EditorManager {
  /**
   * 获取当前编辑器状态
   */
  getState(): EditorState;

  /**
   * 切换编辑模式
   */
  switchMode(mode: EditorMode): Promise<void>;

  /**
   * 插入内容
   */
  insertContent(content: string, options?: InsertOptions): void;

  /**
   * 替换选区内容
   */
  replaceSelection(content: string): void;

  /**
   * 注册快捷键
   */
  registerShortcut(keybinding: string, handler: () => void): Disposable;

  /**
   * 监听内容变化
   */
  onContentChange(callback: (content: string) => void): Disposable;

  /**
   * 执行格式化命令
   */
  executeCommand(command: EditorCommand): void;
}
```

#### 4.2.3 Plugin API 接口

```typescript
// packages/extension-host/src/api.ts
export interface MarkMatePlugin {
  /**
   * 插件元信息
   */
  metadata: PluginMetadata;

  /**
   * 插件激活时调用
   */
  activate(context: PluginContext): void | Promise<void>;

  /**
   * 插件停用时调用
   */
  deactivate?(): void | Promise<void>;
}

export interface PluginContext {
  /**
   * 订阅事件：文档打开、保存、切换等
   */
  subscriptions: Disposable[];

  /**
   * 编辑器 API
   */
  editor: EditorAPI;

  /**
   * 文档 API
   */
  documents: DocumentAPI;

  /**
   * 注册自定义 Markdown 语法
   */
  registerMarkdownSyntax(syntax: CustomSyntax): void;

  /**
   * 注册 UI 组件（工具栏按钮、侧边栏等）
   */
  registerUIComponent(component: UIComponent): void;

  /**
   * 注册命令
   */
  registerCommand(command: Command): void;

  /**
   * 配置存储 API
   */
  storage: StorageAPI;
}
```

---

## 5. 数据模型设计

### 5.1 文档模型

```typescript
export interface MarkdownDocument {
  /**
   * 文档唯一标识
   */
  id: string;

  /**
   * 文档标题（从 H1 提取或文件名）
   */
  title: string;

  /**
   * 原始 Markdown 内容
   */
  content: string;

  /**
   * 解析后的 AST（缓存）
   */
  ast?: Root;

  /**
   * Frontmatter 元数据
   */
  frontmatter?: DocumentFrontmatter;

  /**
   * 文档统计信息
   */
  stats: DocumentStats;

  /**
   * 文件信息
   */
  file?: FileInfo;

  /**
   * 标签
   */
  tags: string[];

  /**
   * 创建/修改时间
   */
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFrontmatter {
  title?: string;
  date?: string;
  author?: string;
  tags?: string[];
  categories?: string[];
  [key: string]: unknown;
}

export interface DocumentStats {
  words: number;
  characters: number;
  paragraphs: number;
  readingTime: number; // 分钟
  headings: number;
  codeBlocks: number;
  images: number;
  links: number;
}

export interface FileInfo {
  path: string;
  name: string;
  extension: string;
  size: number;
  lastModified: Date;
  encoding: string;
}
```

### 5.2 状态管理设计（Zustand）

```typescript
// packages/editor/src/store/editor-store.ts
interface EditorStore {
  // 文档状态
  currentDocument: MarkdownDocument | null;
  openDocuments: MarkdownDocument[];

  // 编辑器状态
  mode: EditorMode;
  isLoading: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // UI 状态
  showSidebar: boolean;
  showOutline: boolean;
  sidebarTab: 'files' | 'search' | 'outline';
  theme: 'light' | 'dark' | 'system';
  fontSize: number;

  // Actions
  openDocument: (path: string) => Promise<void>;
  saveDocument: () => Promise<void>;
  closeDocument: (id: string) => void;
  setMode: (mode: EditorMode) => void;
  setContent: (content: string) => void;
  undo: () => void;
  redo: () => void;
  toggleTheme: () => void;
}
```

---

## 6. API 接口设计

### 6.1 核心命令系统

所有编辑器操作通过命令系统执行，支持撤销/重做和快捷键绑定：

```typescript
// packages/editor/src/commands/index.ts
export const EditorCommands = {
  // 文本格式化
  'format.bold': {
    keybinding: 'Mod-b',
    execute: (editor) => editor.toggleMark('bold'),
  },
  'format.italic': {
    keybinding: 'Mod-i',
    execute: (editor) => editor.toggleMark('italic'),
  },
  'format.strikethrough': {
    keybinding: 'Mod-Shift-s',
    execute: (editor) => editor.toggleMark('strike'),
  },
  'format.code': {
    keybinding: 'Mod-e',
    execute: (editor) => editor.toggleMark('code'),
  },

  // 标题
  'heading.h1': {
    keybinding: 'Mod-1',
    execute: (editor) => editor.setHeading(1),
  },
  'heading.h2': {
    keybinding: 'Mod-2',
    execute: (editor) => editor.setHeading(2),
  },

  // 列表
  'list.bullet': {
    keybinding: 'Mod-Shift-8',
    execute: (editor) => editor.toggleList('bullet'),
  },
  'list.ordered': {
    keybinding: 'Mod-Shift-7',
    execute: (editor) => editor.toggleList('ordered'),
  },
  'list.task': {
    keybinding: 'Mod-Shift-t',
    execute: (editor) => editor.toggleTaskList(),
  },

  // 块级元素
  'block.code': {
    keybinding: 'Mod-Alt-c',
    execute: (editor) => editor.insertCodeBlock(),
  },
  'block.quote': {
    keybinding: 'Mod-Shift-.',
    execute: (editor) => editor.toggleBlockquote(),
  },
  'block.table': {
    execute: (editor) => editor.insertTable(),
  },
  'block.math': {
    execute: (editor) => editor.insertMathBlock(),
  },
  'block.mermaid': {
    execute: (editor) => editor.insertMermaidBlock(),
  },

  // 文件操作
  'file.new': { keybinding: 'Mod-n', execute: () => {} },
  'file.open': { keybinding: 'Mod-o', execute: () => {} },
  'file.save': { keybinding: 'Mod-s', execute: () => {} },

  // 编辑
  'edit.undo': { keybinding: 'Mod-z', execute: () => {} },
  'edit.redo': { keybinding: 'Mod-Shift-z', execute: () => {} },
  'edit.find': { keybinding: 'Mod-f', execute: () => {} },
  'edit.replace': { keybinding: 'Mod-h', execute: () => {} },

  // 视图
  'view.source': { keybinding: 'Mod-Alt-s', execute: () => {} },
  'view.wysiwyg': { keybinding: 'Mod-Alt-w', execute: () => {} },
  'view.split': { keybinding: 'Mod-Alt-v', execute: () => {} },
} as const;
```

---

## 7. 性能设计

### 7.1 性能目标

| 指标 | 目标值 | 测试场景 |
|-----|--------|---------|
| 冷启动时间 | < 2s (Web), < 3s (Desktop) | 生产构建 |
| 大文档加载 | < 500ms | 10 万字 Markdown |
| 输入响应延迟 | < 16ms (60fps) | 连续输入 |
| 模式切换时间 | < 300ms | 5 万字文档切换 |
| 全文搜索响应 | < 100ms | 100 篇文档 |
| 内存占用 | < 500MB | 打开 10 个文档 |
| 导出 PDF | < 5s | 100 页文档 |

### 7.2 性能优化策略

1. **虚拟滚动**: CodeMirror 和预览区采用虚拟滚动，只渲染可视区域
2. **增量解析**: 大文档分片解析，不阻塞主线程
3. **Web Workers**: 解析、搜索、索引放在 Worker 线程
4. **AST 缓存**: 解析结果缓存，只重新解析变更部分
5. **防抖节流**: 实时预览、搜索等高频操作防抖处理
6. **懒加载**: 代码高亮、Mermaid 图表按需渲染
7. **虚拟列表**: 文件树、大纲等长列表虚拟化
8. **Memoization**: React 组件 memo + useMemo/useCallback 优化重渲染

### 7.3 大文档处理方案

```typescript
// packages/core/src/parser/incremental-parser.ts
export class IncrementalParser {
  /**
   * 分片解析大文档
   * 使用 requestIdleCallback 在浏览器空闲时处理
   */
  async parseLargeDocument(
    markdown: string,
    onProgress: (progress: number) => void,
    chunkSize = 5000
  ): Promise<Root> {
    const chunks = this.splitIntoChunks(markdown, chunkSize);
    let mergedAst: Root | null = null;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkAst = await this.parseInWorker(chunk);
      mergedAst = this.mergeAst(mergedAst, chunkAst);
      onProgress((i + 1) / chunks.length);
      await this.yieldToMain();
    }

    return mergedAst!;
  }
}
```

---

## 8. 安全设计

### 8.1 XSS 防护层级

```
┌─────────────────────────────────────────┐
│      1. rehype-sanitize Schema          │
│      (白名单标签/属性)                  │
├─────────────────────────────────────────┤
│      2. DOMPurify 二次清洗              │
│      (运行时 DOM 清理)                  │
├─────────────────────────────────────────┤
│      3. React 默认转义                  │
│      (JSX 自动转义文本)                 │
├─────────────────────────────────────────┤
│      4. CSP 内容安全策略                │
│      (限制脚本执行、资源加载)           │
├─────────────────────────────────────────┤
│      5. 插件沙箱隔离                    │
│      (iframe/Worker 权限隔离)           │
└─────────────────────────────────────────┘
```

### 8.2 安全配置

```typescript
// packages/core/src/security/sanitize-schema.ts
export const sanitizeSchema = {
  // 允许的标签
  tagNames: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li', 'input',
    'blockquote', 'pre', 'code',
    'em', 'strong', 'del', 'ins', 'a',
    'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
    'svg', 'path',
    // 自定义组件标签
    'mermaid-diagram', 'math-block', 'math-inline',
  ],
  // 允许的属性
  attributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    code: ['class', 'data-language'],
    pre: ['class', 'data-language'],
    input: ['type', 'checked', 'disabled'],
    th: ['align'],
    td: ['align'],
    '*': ['className', 'id'],
    // Mermaid
    'mermaid-diagram': ['data-source'],
  },
  // 强制属性
  required: {
    a: { rel: 'noopener noreferrer', target: '_blank' },
    img: { loading: 'lazy' },
  },
  // 协议白名单
  protocols: {
    href: ['http', 'https', 'mailto', 'tel', 'relative'],
    src: ['http', 'https', 'data', 'relative'],
  },
};
```

---

## 9. 扩展性设计

### 9.1 插件生命周期

```
注册 → 激活 → 运行 → 停用 → 卸载
 │       │       │       │       │
 │       │       │       │       └─ 清理持久化数据
 │       │       │       └───────── 调用 deactivate()，释放资源
 │       │       └───────────────── 正常运行，响应事件
 │       └───────────────────────── 调用 activate()，注册 UI/命令
 └───────────────────────────────── 用户安装/配置时
```

### 9.2 扩展点

| 扩展点 | 说明 | 示例 |
|-------|------|------|
| CustomSyntax | 自定义 Markdown 语法 | Wiki 链接 `[[page]]`、标签 `#tag` |
| ToolbarItem | 工具栏按钮 | 导出 PDF、插入日期 |
| SidebarPanel | 侧边栏面板 | 文件树、大纲、搜索 |
| Command | 命令 | 自定义格式化、操作 |
| Renderer | 自定义渲染器 | 特殊代码块渲染 |
| Exporter | 导出格式 | 导出 EPUB、Markdoc |
| Theme | 主题 | 自定义配色方案 |
| Shortcut | 快捷键绑定 | Vim 模式、Emacs 模式 |

---

## 10. 测试策略

| 测试类型 | 工具 | 覆盖范围 | 目标覆盖率 |
|---------|------|---------|-----------|
| 单元测试 | Vitest | Parser、工具函数、核心逻辑 | > 90% |
| 组件测试 | React Testing Library | UI 组件交互 | > 80% |
| 集成测试 | Vitest | 模块协作、状态管理 | > 70% |
| E2E 测试 | Playwright | 用户流程、跨浏览器 | 核心场景 |
| 性能测试 | Lighthouse + 自定义 | 大文档性能 | 达标 |
| 安全测试 | OWASP ZAP | XSS、注入 | 无高危漏洞 |
| 无障碍测试 | axe-core | WCAG 2.1 AA | 通过 |

---

## 11. 模块化架构

### 11.1 Monorepo 包设计

采用 pnpm workspace 管理的 Monorepo 架构，每个功能域作为独立包发布，确保关注点分离、独立测试、独立版本管理。

```
markmate/
├── packages/
│   ├── @markmate/core           # 核心引擎：无 UI 依赖
│   │   ├── parser/              # Markdown 解析器（Unified/Remark/Rehype）
│   │   ├── document/            # 文档模型与服务
│   │   ├── utils/               # 工具函数
│   │   └── types/               # 共享类型定义
│   │
│   ├── @markmate/ui             # UI 组件库与设计令牌
│   │   ├── tokens/              # 设计令牌（颜色、排版、间距等）
│   │   ├── components/          # 基础 UI 组件（Button、Tooltip 等）
│   │   ├── lib/                 # UI 工具函数（cn、hooks）
│   │   └── styles/              # 全局样式、主题 CSS 变量
│   │
│   ├── @markmate/editor         # 编辑器集成层
│   │   ├── source-mode/         # 源码模式（CodeMirror 6）
│   │   ├── wysiwyg-mode/        # WYSIWYG 模式（Tiptap/ProseMirror）
│   │   ├── mode-switcher/       # 模式切换控制器
│   │   ├── commands/            # 命令系统
│   │   ├── shortcuts/           # 快捷键管理器
│   │   └── store/               # 编辑器状态管理（Zustand）
│   │
│   ├── @markmate/renderer       # Markdown 渲染组件
│   │   ├── components/          # React 渲染组件
│   │   └── styles/              # Markdown 预览样式
│   │
│   ├── @markmate/file-system    # 文件系统抽象层
│   │   ├── fs-interface.ts      # 统一接口定义
│   │   ├── browser-fs.ts        # 浏览器 File System Access API
│   │   ├── local-fs.ts          # Electron 本地文件系统
│   │   └── virtual-fs.ts        # 内存虚拟文件系统（测试用）
│   │
│   ├── @markmate/search         # 搜索模块
│   │   ├── indexer.ts           # FlexSearch 全文索引
│   │   ├── searcher.ts          # 搜索引擎
│   │   └── worker.ts            # Web Worker 后台索引
│   │
│   ├── @markmate/export         # 导出模块
│   │   ├── html-exporter.ts
│   │   ├── pdf-exporter.ts
│   │   └── docx-exporter.ts
│   │
│   └── @markmate/extension-host # 插件宿主环境
│       ├── sandbox.ts           # 插件沙箱（Worker/iframe 隔离）
│       ├── api.ts               # 插件 API 暴露
│       └── registry.ts          # 插件注册中心
│
└── apps/
    ├── web/                     # Web 应用入口
    └── desktop/                 # Electron 桌面应用入口
```

### 11.2 模块间依赖关系

严格遵循单向依赖原则，核心层不依赖任何 UI 层：

```
apps/* → packages/* → @markmate/core
                    ↗
           @markmate/ui
                    ↘
           @markmate/renderer → @markmate/core
           @markmate/editor   → @markmate/ui + @markmate/core
           @markmate/search   → @markmate/core
           @markmate/export   → @markmate/core + @markmate/renderer
           @markmate/file-system → @markmate/core
           @markmate/extension-host → @markmate/core + @markmate/editor
```

**依赖规则**:
- `@markmate/core` 零外部 UI 依赖，可在 Node.js 和浏览器环境运行
- 所有 React 组件只能依赖 `@markmate/ui`，不能直接使用 Radix UI
- 状态管理逻辑放在 store 中，组件只负责渲染和交互
- 跨包通信通过事件总线或明确的 API 调用，禁止直接引用内部实现

### 11.3 包边界约定

| 约定 | 说明 |
|-----|------|
| Public API | 每个包通过 `index.ts` 导出，外部只能从包根导入 |
| Internal | 包内文件使用相对路径导入，禁止跨包深层导入 |
| Peer Dependencies | React 等通用库设为 peerDependencies，避免多实例问题 |
| Versioning | 所有包使用统一版本号（Fixed Versioning） |
| Testing | 每个包独立配置测试，不依赖其他包的测试工具 |

---

## 12. UI 设计令牌系统

### 12.1 令牌分层架构

采用三层令牌架构，确保设计一致性和主题可扩展性：

```
┌─────────────────────────────────────────────────┐
│  Primitive Tokens (原始令牌)                    │
│  硬编码值：colors、spacing、typography          │
│  不直接在组件中使用                              │
├─────────────────────────────────────────────────┤
│  Semantic Tokens (语义令牌)                     │
│  基于 primitive 的语义命名                      │
│  --mm-color-bg, --mm-color-text 等              │
│  支持亮色/暗色主题切换                          │
├─────────────────────────────────────────────────┤
│  Component Tokens (组件令牌)                    │
│  组件级别的特定令牌                              │
│  --mm-toolbar-bg, --mm-editor-cursor 等         │
│  组件内使用，可被主题覆盖                        │
└─────────────────────────────────────────────────┘
```

### 12.2 令牌分类

#### 颜色令牌

```typescript
// Primitive Colors
const colors = {
  gray: { 50, 100, 200, ..., 950 },    // 中性色阶
  brand: { 50, 100, ..., 950 },        // 品牌色阶
  success: { ... },                    // 成功色
  warning: { ... },                    // 警告色
  error: { ... },                      // 错误色
  info: { ... },                       // 信息色
}

// Semantic Colors (CSS Variables)
--mm-color-bg: var(--mm-color-white);           // 背景
--mm-color-bg-subtle: var(--mm-color-gray-50);  // 次级背景
--mm-color-text: var(--mm-color-gray-900);      // 正文
--mm-color-text-muted: var(--mm-color-gray-500);// 辅助文字
--mm-color-border: var(--mm-color-gray-200);    // 边框
--mm-color-accent: var(--mm-color-brand-500);   // 强调色
```

#### 排版令牌

```typescript
const fontFamilies = {
  sans: 'system-ui, -apple-system, ...',
  mono: '"JetBrains Mono", "Fira Code", ...',
  serif: 'Georgia, Cambria, ...',
}

const fontSizes = { xs, sm, base, lg, xl, 2xl, ..., 6xl }
const lineHeights = { none, tight, snug, normal, relaxed, loose }
const fontWeights = { thin, light, normal, medium, semibold, bold, black }
```

#### 间距与尺寸令牌

```typescript
const spacing = { 0, px, 0.5, 1, 1.5, 2, ..., 96 }  // 0-24rem
const sizes = {
  sidebar: { width: '280px', minWidth: '200px', maxWidth: '400px' },
  toolbar: { height: '40px' },
  statusbar: { height: '24px' },
  editor: { maxWidth: '900px' },
}
const borderRadius = { none, sm, DEFAULT, md, lg, xl, 2xl, 3xl, full }
```

#### 动效令牌

```typescript
const transitions = {
  fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
}

const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
}
```

#### Z-Index 层级令牌

```typescript
const zIndices = {
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  toast: 1700,
  tooltip: 1800,
}
```

### 12.3 主题系统

通过 CSS 自定义属性实现主题切换，支持 `data-theme` 属性切换：

```css
/* 默认亮色主题 */
:root {
  --mm-color-bg: #ffffff;
  --mm-color-text: #111827;
  /* ... */
}

/* 暗色主题 */
[data-theme="dark"] {
  --mm-color-bg: #111827;
  --mm-color-text: #f3f4f6;
  /* ... */
}

/* 跟随系统 */
@media (prefers-color-scheme: dark) {
  :root[data-theme="system"] {
    --mm-color-bg: #111827;
    /* ... */
  }
}
```

### 12.4 UI 组件规范

基于 Radix UI + Tailwind CSS + CVA 构建可访问、可组合的组件库：

- **无样式原语**: 使用 Radix UI 的无样式组件确保无障碍（a11y）
- **变体系统**: 使用 class-variance-authority (cva) 定义组件变体
- **样式合并**: 使用 `cn()` 工具函数合并 clsx + tailwind-merge
- **暗色模式**: 通过 `dark:` 前缀和 CSS 变量双重支持

```typescript
// 组件变体示例
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-600 text-white hover:bg-brand-700',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100',
        toolbar: 'h-8 w-8 p-0 hover:bg-[var(--mm-toolbar-hover)]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        icon: 'h-9 w-9',
        toolbar: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);
```

---

## 13. 用户交互体验优化

### 13.1 键盘导航与快捷键

**设计原则**: 所有操作可通过键盘完成，鼠标用户有额外便利。

| 功能 | 交互设计 |
|-----|---------|
| 快捷键提示 | Tooltip 中显示快捷键（Mac显示⌘，Windows显示Ctrl） |
| 命令面板 | Ctrl/Cmd+Shift+P 呼出，支持模糊搜索命令 |
| 快速文件打开 | Ctrl/Cmd+P 快速切换文件 |
| Vim/Emacs 模式 | 插件可扩展，默认提供类 VS Code 快捷键 |
| 焦点管理 | 模态框打开时焦点陷阱，关闭时返回触发器 |
| 焦点可见 | `:focus-visible` 始终显示清晰的焦点环 |

### 13.2 即时反馈与状态指示

- **保存状态**: 标题栏显示"已保存"、"正在保存..."、"未保存更改"
- **操作反馈**: Toast 通知成功/失败/警告/信息（自动消失，可关闭）
- **加载状态**: Skeleton 骨架屏而非 Spinner，不阻塞用户操作
- **进度指示**: 大文档解析/导出显示进度条（0-100%）
- **撤销/重做**: 工具栏按钮根据 canUndo/canRedo 状态禁用/启用

### 13.3 编辑体验优化

- **输入延迟**: 使用防抖（30ms）渲染预览，不阻塞输入
- **自动保存**: 失焦或停止输入 2 秒后自动保存
- **光标同步**: 模式切换时尽量保持光标在相似位置
- **智能粘贴**: 粘贴 HTML 自动转换为 Markdown，粘贴 URL 在选中文本上自动创建链接
- **拖放支持**: 拖拽图片文件自动插入，拖拽文本移动/复制
- **自动配对**: 括号、引号、代码块围栏自动闭合
- **缩进保持**: 列表项回车自动保持缩进和列表标记

### 13.4 可访问性（A11y）

遵循 WCAG 2.1 AA 标准：

- **语义化 HTML**: 使用正确的标签（nav、main、article、aside）
- **ARIA 标签**: 图标按钮有 aria-label，交互元素有适当 role
- **颜色对比度**: 文本对比度 ≥ 4.5:1，大文本 ≥ 3:1
- **键盘操作**: 所有交互元素可通过 Tab 聚焦和 Enter/Space 激活
- **屏幕阅读器**: Radix UI 组件内置屏幕阅读器支持
- **减少动画**: 尊重 `prefers-reduced-motion` 系统设置
- **缩放支持**: 界面支持 200% 缩放不溢出

### 13.5 滚动与导航

- **大纲同步**: 编辑时大纲面板高亮当前章节，点击大纲跳转
- **同步滚动**: 分屏模式下左右同步滚动（基于标题位置映射）
- **回到顶部**: 长文档显示回到顶部按钮
- **锚点导航**: 点击目录链接平滑滚动（scroll-behavior: smooth）
- **滚动边距**: 标题设置 scroll-margin-top 避免被工具栏遮挡

### 13.6 错误处理与恢复

- **优雅降级**: Mermaid/数学公式渲染失败时显示源代码和错误提示
- **错误边界**: React Error Boundary 捕获渲染错误，不导致白屏
- **自动恢复**: 文档内容定时备份到 localStorage，崩溃后可恢复
- **友好提示**: XSS 被拦截时不静默，通知用户内容被安全过滤
- **离线支持**: Service Worker 缓存静态资源，离线可打开已查看文档

### 13.7 性能感知优化

- **骨架屏**: 大文档加载时显示骨架占位而非空白
- **渐进式渲染**: 内容分块渲染，先显示文字再加载图片/图表
- **乐观更新**: 保存时立即更新 UI 状态，后台异步写入磁盘
- **懒加载**: Mermaid 图表进入视口才开始渲染
- **预加载**: 鼠标悬停链接时预加载目标文档

---

*文档结束*
