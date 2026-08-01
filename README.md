# MarkMate

一款专业的 Markdown 文档阅读器与编辑器，基于 Electron + React + CodeMirror 6 构建，提供高性能、沉浸式的文档写作体验。

## 功能特性

- **多标签编辑**：同时打开多个文档，标签页自由切换
- **实时预览**：源码 / 预览 / 分屏三种视图模式，滚动同步
- **文件管理**：侧边栏文件树，支持打开文件夹浏览
- **编辑体验**：Markdown 语法高亮、快捷键、工具栏快捷操作
- **主题切换**：亮色 / 暗色 / 跟随系统
- **自动保存**：可配置的自动保存策略，关闭前未保存确认
- **文档统计**：状态栏实时显示字数、字符数等信息
- **安全防护**：DOMPurify XSS 过滤，渲染内容安全清洗
- **性能优化**：大文件限制、LRU 缓存、内存监控与 GC 调优
- **文件关联**：支持关联 `.md` / `.markdown` / `.txt` 文件双击打开

## 技术栈

| 领域 | 选型 |
|------|------|
| 桌面框架 | Electron 31 |
| UI 框架 | React 18 + TypeScript 5 |
| 状态管理 | Zustand |
| 编辑器 | CodeMirror 6 |
| Markdown 渲染 | marked + DOMPurify |
| 样式 | Tailwind CSS |
| 构建工具 | Vite 5 + electron-builder |
| 包管理 | pnpm workspace (Monorepo) |

## 项目结构

```
markmate/
├── apps/
│   └── desktop/              # Electron 桌面应用
│       ├── electron/         # 主进程 / 预加载脚本
│       └── src/
│           ├── components/   # UI 组件（编辑器、预览、侧边栏等）
│           ├── store/        # Zustand 状态（tabs / config / editor）
│           └── hooks/        # 滚动同步等 Hooks
├── packages/
│   ├── core/                 # @markmate/core — 解析器、文档模型（无 UI 依赖）
│   ├── editor/               # @markmate/editor — 命令系统、快捷键
│   ├── renderer/             # @markmate/renderer — Markdown 渲染组件
│   └── ui/                   # @markmate/ui — 设计令牌与基础组件
├── docs/                     # 架构与规划文档
└── tests/                    # 测试
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8

### 安装依赖

```bash
pnpm install
```

Windows 也可以直接运行：

```cmd
apps\desktop\setup.cmd
```

### 开发模式

```bash
cd apps/desktop
pnpm dev
```

或运行 `apps\desktop\dev.cmd`。

### 构建

```bash
cd apps/desktop

# NSIS 安装包
pnpm build:win

# 免安装便携版
pnpm build:portable

# 仅打包目录（不生成安装包）
pnpm build:unpack
```

构建产物输出到 `apps/desktop/release/`。

### 其他命令

```bash
pnpm test          # 单元测试 (Vitest)
pnpm lint          # ESLint 检查
pnpm typecheck     # TypeScript 类型检查
pnpm format        # Prettier 格式化
```

## 文档

- [架构设计文档](docs/ARCHITECTURE.md)
- [项目推进计划](docs/ROADMAP.md)
- [功能开发路线图](docs/FEATURE-ROADMAP.md)

## 许可证

MIT
