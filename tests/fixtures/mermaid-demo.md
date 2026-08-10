# Mermaid 图表演示

MarkMate 现在支持 Mermaid 图表渲染，包括流程图、时序图、甘特图、类图等多种图表类型。

## 1. 流程图 (Flowchart)

```mermaid
graph TD
    A[开始] --> B{是否登录?}
    B -->|是| C[进入主页]
    B -->|否| D[跳转登录页]
    D --> E[输入账号密码]
    E --> F{验证通过?}
    F -->|是| C
    F -->|否| D
    C --> G[结束]
```

## 2. 时序图 (Sequence Diagram)

```mermaid
sequenceDiagram
    participant 用户
    participant 前端
    participant 后端
    participant 数据库

    用户->>前端: 点击登录按钮
    前端->>后端: 发送登录请求
    后端->>数据库: 查询用户信息
    数据库-->>后端: 返回用户数据
    后端-->>前端: 返回登录令牌
    前端-->>用户: 登录成功
```

## 3. 甘特图 (Gantt Chart)

```mermaid
gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 设计阶段
    需求分析     :done,    des1, 2026-08-01, 3d
    UI设计       :active,  des2, after des1, 5d
    架构设计     :         des3, after des1, 4d
    section 开发阶段
    前端开发     :         dev1, after des2, 10d
    后端开发     :         dev2, after des3, 12d
    section 测试阶段
    单元测试     :         test1, after dev1, 5d
    集成测试     :         test2, after dev2, 4d
```

## 4. 类图 (Class Diagram)

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +int lives
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

## 5. 状态图 (State Diagram)

```mermaid
stateDiagram-v2
    [*] --> 待支付
    待支付 --> 已支付: 支付成功
    待支付 --> 已取消: 用户取消
    已支付 --> 已发货: 商家发货
    已发货 --> 已送达: 物流配送
    已送达 --> [*]
```

## 6. 饼图 (Pie Chart)

```mermaid
pie title 编程语言使用占比
    "JavaScript" : 35
    "Python" : 28
    "Java" : 18
    "TypeScript" : 12
    "其他" : 7
```

## 7. ER图 (Entity Relationship)

```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    CUSTOMER {
        string name
        string email
    }
    ORDER ||--|{ LINE-ITEM : contains
    ORDER {
        int orderNumber
        date created
    }
    LINE-ITEM {
        string productCode
        int quantity
        float price
    }
```

## 8. Git提交图 (Git Graph)

```mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature
    commit
```

## 错误处理示例

语法错误的图表会显示错误提示：

```mermaid
graph TD
    A --> B
    B --> C
    C --> 这是一个语法错误 {{{
```

## 数学公式与图表混合

行内公式：$E = mc^2$

块级公式：

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

以上是 Mermaid 支持的主要图表类型，你可以根据需要在文档中使用！
