# monorepo

全栈 Monorepo 脚手架：React + TypeScript + Tailwind CSS 前端，Node.js + Express + Prisma 后端。

代码规范见 [AGENT_PROMPTS.md](./AGENT_PROMPTS.md)——所有 AI Agent 在此仓库生成代码时必须遵守。

## 目录结构

```
monorepo/
├── frontend/          # React 18 + TS + Tailwind + Vite
│   └── src/           # pages / components / hooks / store / api
├── backend/           # Node.js + Express + TS + Prisma
│   └── src/           # routes / controllers / services / middleware
├── shared/            # @monorepo/shared：前后端共享类型 + Zod 校验
├── database/          # Prisma schema + 原生 SQL 迁移脚本
├── deploy/            # Dockerfile / docker-compose.yml / Nginx
└── .github/           # PR 模板
```

## 示例模块

用户认证（注册 / 登录 / JWT / 我的信息），前后端打通：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 注册 → 201 |
| POST | /api/auth/login | 登录 → 200 + token |
| GET | /api/auth/me | 需 Bearer token |
| GET | /api/health | 健康检查 |

统一响应：成功 `{success:true, data}`，失败 `{success:false, error:{code,message}}`。

## 快速开始

```bash
npm install
cp backend/.env.example backend/.env   # 填写 JWT_SECRET（至少 16 位）
cp frontend/.env.example frontend/.env

# 数据库（SQLite，零配置）
npm run db:push --workspace=backend

# 启动
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run type-check` | 全仓类型检查（strict） |
| `npm run test` | 全仓测试 |
| `npm run test:coverage` | 测试 + 覆盖率（行≥85% / 函数≥90% / 分支≥80%） |
| `npm run build` | 全仓构建 |

## Docker 部署

```bash
cd deploy && docker compose up --build -d
# 前端 http://localhost:8080，API 经 Nginx 代理到后端
```

详见 [deploy/README.md](./deploy/README.md)。

## 约定

- 禁止 `any`，未知输入用 `unknown` + Zod 收窄
- 后端 Controller / Service 分离，具名异常类统一错误处理
- 前端表单用 React Hook Form + Zod，复杂逻辑抽自定义 Hook
- Commit 遵循 Conventional Commits（`feat:` / `fix:` / `test:` / `docs:`）
