---
title: MarkMate 功能测试文档
author: MarkMate Team
date: 2026-07-31
tags:
  - Markdown
  - 测试
  - 示例
categories:
  - 文档
  - 测试
---

# Markdown 解析器功能测试文档

这是一个用于验证 **MarkMate** 核心解析器功能的测试文档。本文档涵盖了标准 Markdown 和 GFM（GitHub Flavored Markdown）的各种语法元素。

## 目录

- [文本格式化](#文本格式化)
- [列表功能](#列表功能)
- [代码展示](#代码展示)
- [表格演示](#表格演示)
- [链接与图片](#链接与图片)
- [引用与分隔线](#引用与分隔线)
- [数学公式](#数学公式)
- [特殊字符与边界](#特殊字符与边界)

---

## 文本格式化

### 基本格式

这是一段普通的段落文本。Markdown 支持多种行内文本格式化方式：

- **粗体文本** 使用双星号或双下划线
- *斜体文本* 使用单星号或单下划线
- ***粗斜体文本*** 同时使用粗体和斜体
- ~~删除线文本~~ 使用双波浪线
- `行内代码` 使用反引号包裹
- [链接文本](https://example.com) 支持行内链接
- 这是 **粗体中嵌套 *斜体*** 的情况
- 这是 *斜体中嵌套 **粗体*** 的情况

### 上下标与特殊标记

- H~2~O 是水的化学式（下标）
- X^2^ 表示X的平方（上标）
- ==高亮文本== （扩展语法）
- 按 <kbd>Ctrl</kbd>+<kbd>C</kbd> 复制

### 链接引用

这是一个 [行内链接](https://github.com "GitHub 首页")，带标题属性。

这是一个 [引用式链接][ref1] 的示例。

[ref1]: https://example.com "引用式链接示例"

自动链接支持：<https://example.com> 和 <mail@example.com>。

---

## 列表功能

### 无序列表

- 列表项目一
  - 嵌套项目 A
  - 嵌套项目 B
    - 三级嵌套项目
- 列表项目二
- 列表项目三

### 有序列表

1. 第一项
   1. 子项 1.1
   2. 子项 1.2
2. 第二项
3. 第三项
   - 无序列表和有序列表可以混合嵌套
   - 第二点

### 任务列表（GFM）

- [x] 已完成的任务
- [x] 另一个已完成任务
- [ ] 未完成的任务
- [ ] 待办事项一
  - [x] 子任务已完成
  - [ ] 子任务待完成

### 定义列表

Markdown
: 一种轻量级标记语言

解析器
: 将 Markdown 转换为 HTML/AST 的程序

---

## 代码展示

### 行内代码

在命令行中输入 `npm install` 安装依赖，然后运行 `npm run dev` 启动开发服务器。

### 代码块

JavaScript 代码示例：

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const result = fibonacci(10);
console.log(`Fibonacci(10) = ${result}`);
```

TypeScript 类型定义：

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: Date;
}

function createUser(data: Omit<User, 'id' | 'createdAt'>): User {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    ...data,
  };
}
```

Python 数据处理：

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

numbers = [3, 6, 8, 10, 1, 2, 1]
print(quicksort(numbers))
```

没有语法高亮的代码块：

```
Plain text code block
No syntax highlighting applied
Line 3
```

---

## 表格演示

### 基础表格

| 姓名 | 年龄 | 职业 | 城市 |
|------|-----:|------|------|
| 张三 | 28 | 工程师 | 北京 |
| 李四 | 32 | 设计师 | 上海 |
| 王五 | 25 | 产品经理 | 深圳 |

### 对齐方式表格

| 左对齐 | 居中对齐 | 右对齐 |
|:-------|:--------:|-------:|
| 内容1 | 内容2 | 内容3 |
| 较长的内容 | 短 | 中等长度 |
| A | B | C |

### GFM 表格（复杂内容）

| 功能 | 支持状态 | 说明 |
|------|:-------:|------|
| 标题 | ✅ | H1-H6 |
| **粗体** | ✅ | 使用 `**` |
| [链接](https://example.com) | ✅ | 行内和引用式 |
| 代码块 | ✅ | ``` 语法 |
| 数学公式 | 🔄 | 部分支持 |
| Mermaid 图表 | 📋 | 计划中 |

---

## 链接与图片

### 图片

![示例图片](https://via.placeholder.com/600x200/3b82f6/ffffff?text=MarkMate+Banner "MarkMate 横幅图片")

带尺寸的图片：

![小图标](https://via.placeholder.com/48/22c55e/ffffff?text=✓ "成功图标")

图片链接（点击图片跳转）：

[![点击跳转](https://via.placeholder.com/300x100/f59e0b/000000?text=Click+Me)](https://example.com)

### 锚点链接

跳转到 [文本格式化](#文本格式化) 章节。

跳转到 [数学公式](#数学公式) 章节。

---

## 引用与分隔线

### 引用块

> 这是一段引用文本。
> 
> 引用可以包含多个段落。
>
> > 引用也可以嵌套使用。
> > 
> > 这是嵌套的引用内容。
>
> 回到外层引用。

### 带署名的引用

> "代码就像幽默。当你需要解释它时，它就不好了。"
> 
> —— Cory House

### 多个分隔线样式

---

***

___

---

## 数学公式

### 行内公式

质能方程：$E = mc^2$，其中 $E$ 表示能量，$m$ 表示质量，$c$ 表示光速。

勾股定理：$a^2 + b^2 = c^2$

二次方程求根公式：$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$

### 块级公式

欧拉恒等式：

$$e^{i\pi} + 1 = 0$$

求和公式：

$$\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$

矩阵表示：

$$
A = \begin{pmatrix}
a_{11} & a_{12} & a_{13} \\
a_{21} & a_{22} & a_{23} \\
a_{31} & a_{32} & a_{33}
\end{pmatrix}
$$

积分运算：

$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

---

## 特殊字符与边界

### HTML 标签（应被转义或过滤）

<div>这是一个 div 标签</div>
<span style="color:red">红色文本</span>
<script>alert('XSS 测试 - 应被过滤')</script>
<img src="x" onerror="alert('XSS')">
<a href="javascript:alert('XSS')">危险链接</a>

### 特殊字符转义

以下字符如果需要原样显示应该使用反斜杠转义：

\* 不是斜体\*
\` 不是代码\`
\# 不是标题
\[ 不是链接
\]

### 转义字符测试

\\ 反斜杠
\` 反引号
\* 星号
\_ 下划线
\{\} 花括号
\[\] 方括号
\(\) 小括号
\# 井号
\+ 加号
\- 减号
\. 点
\! 感叹号

### 空行和空格

这是第一段。

这是第二段（中间有空行）。

行尾两个空格  
强制换行。

### 重复符号测试

************************分隔线************************

## 标题 H2 紧跟引用

> 标题下方的引用块

### 极端嵌套测试

- 第一层
  - 第二层
    - 第三层
      - 第四层
        - 第五层
          - 第六层（最深）
            - 第七层
              - 第八层
                - 第九层

## 大段落测试（性能测试用）

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

中文段落测试：Markdown 是一种轻量级标记语言，创始人为约翰·格鲁伯。它允许人们使用易读易写的纯文本格式编写文档，然后转换成有效的 XHTML（或者 HTML）文档。这种语言吸收了很多在电子邮件中已有的纯文本标记的特性。由于 Markdown 的轻量化、易读易写特性，并且对于图片，图表、数学式都有支持，目前许多网站都广泛使用 Markdown 来撰写帮助文档或是用于论坛上发表消息。

数字和英文混合测试：在 2026 年，使用 Markdown 编写文档已经成为开发者的标配。VS Code、Obsidian、Typora 等工具都提供了优秀的 Markdown 编辑体验。

### 列表后紧跟表格

- 列表项 A
- 列表项 B
- 列表项 C

| 列1 | 列2 |
|-----|-----|
| 1 | 2 |
| 3 | 4 |

---

## 文档结束

本文档包含了 Markdown 解析器需要处理的主要语法场景。测试时应验证：

1. ✅ Frontmatter YAML 元数据解析
2. ✅ 标题层级正确识别（H1-H6）
3. ✅ 文本格式化（粗体/斜体/删除线/代码）
4. ✅ 嵌套列表和任务列表
5. ✅ 多语言代码块语法高亮标记
6. ✅ 表格对齐方式
7. ✅ 链接和图片引用
8. ✅ 引用块嵌套
9. ✅ 数学公式（行内和块级）
10. ✅ XSS 安全过滤
11. ✅ 特殊字符转义
12. ✅ 统计信息（字数、段落、代码块数等）
