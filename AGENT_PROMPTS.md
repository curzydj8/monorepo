# AGENT_PROMPTS.md — Muse AI Agent 执行与代码规范指南

本文档规定了 Muse AI Agent 在本仓库中自动生成代码时的严格规则、架构边界以及代码质量标准。

## 1. 项目核心理念与基本规则

**Monorepo 架构完整性：**
- `frontend/`：React + TypeScript + Tailwind CSS（基于 Vite 构建）。
- `backend/`：Node.js + TypeScript + Express/Fastify（若任务明确指定亦可使用 Go/Rust）。
- `database/`：原生 SQL 迁移脚本/Schema 以及 Prisma/TypeORM 数据模型。
- `deploy/`：Dockerfile、docker-compose.yml 及 Nginx 部署配置。

- **切勿破坏现有代码**：在提交 PR 前，务必验证所有导出函数、内部 API 路由以及类型声明的兼容性。
- **禁止占位符与伪代码**：严禁编写 `// TODO: 稍后实现` 或 `// 模拟返回数据`。所有功能、中间件和业务逻辑必须完整实现，并具备真实的输入校验与异常处理。

## 2. TypeScript 与类型安全规范

- **开启 Strict 严格模式**：项目根目录 `tsconfig.json` 中必须设置 `"strict": true`。
- **严禁直接使用 any**：
  - 严禁使用 `any` 类型。
  - 对于未确定的输入数据，必须使用 `unknown` 类型，并通过 Zod 或类型守卫函数（Type Guards）进行运行时类型收窄。
- **共享类型层**：
  - 将共享的 DTO（数据传输对象）和接口定义统一存放在 `@shared/types` 或各自模块的 `types` 目录下。
  - 优先使用 `interface` 定义对象契约，使用 `type` 定义联合类型与基础类型。
- **严格的空值检查**：显式处理 `null` 和 `undefined`。优先使用可选链（`?.`）和空值合并运算符（`??`）。

## 3. 代码风格与格式化规范

### 前端（React / TypeScript）
- **组件范式**：使用函数式组件，并显式标注类型或直接对函数参数进行类型定义。
- **样式规范**：统一使用 Tailwind CSS 原子类。除非需要动态计算像素值，否则禁止使用 `style={...}` 内联样式。
- **状态与表单**：
  - 表单管理与校验统一采用 React Hook Form + Zod。
  - 保持状态作用域清晰，全局 UI 状态使用 React Context 或 Zustand。
- **自定义 Hooks**：复杂的业务逻辑必须抽离为独立的自定义 Hook（`use*.ts`）。

### 后端（Node.js / Express 或 Fastify）
- **控制器/服务层分离**：
  - Controllers：仅负责路由注册、请求参数校验以及 HTTP 响应状态码返回。
  - Services：负责核心业务逻辑、数据转换与数据库查询。
- **全局错误处理**：
  - 所有路由必须由错误捕获中间件统一包裹。
  - 统一抛出具名的自定义异常类（如 `HttpError`、`ValidationError`、`NotFoundError`）。
- **异步代码**：一律使用 `async/await`，禁止混用 `.then()`/`.catch()` 链式调用。

### 数据库与 SQL
- 显式声明主键（优先使用 UUID）、默认值、NOT NULL 约束以及外键索引。
- 编写原生 SQL 或 ORM 模型定义，迁移文件按顺序存放在 `database/migrations/` 目录下。

## 4. 测试覆盖率与质量要求

任何新增的功能模块或修改的代码，必须包含对应的测试用例，且满足以下最低代码覆盖率要求：
- 语句 / 行覆盖率（Statements/Lines）：不低于 85%
- 函数覆盖率（Functions）：不低于 90%
- 分支覆盖率（Branches）：不低于 80%

**测试栈具体规范**
- **前端测试**：使用 Vitest + React Testing Library。
  - 必须测试用户交互逻辑（点击事件、表单输入、校验错误信息渲染等）。
  - API 请求统一使用 MSW (Mock Service Worker) 进行 Mock 拦截。
- **后端测试**：使用 Supertest + Vitest (或 Jest)。
  - 必须为 Service 层逻辑编写完整的单元测试。
  - 必须为 API 端点编写集成测试，校验不同的 HTTP 响应状态码（200、400、401、404、500）。

## 5. PR 与 Git 提交规范

在创建 Pull Request (PR) 或 Commit 时，必须严格遵循以下约定：

- **Commit 格式**：遵循 Angular / Conventional Commits 规范：
  - `feat(scope): 增加用户身份认证接口`
  - `fix(scope): 修复 Token 刷新时用户对象为空的问题`
  - `test(scope): 为用户服务模块增加单元测试`
  - `docs(scope): 在 README 中更新 API 接口文档说明`
- **PR 描述文本**：必须包含：
  - 修改内容的简要总结。
  - 具体的测试验证步骤。
  - 确认已通过类型检查和测试的 Checkbox 列表（如运行 `npm run type-check` 和 `npm run test`）。
