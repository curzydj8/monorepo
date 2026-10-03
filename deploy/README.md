# deploy/ — 部署说明

Docker 化部署：后端 API（Node 20）+ 前端静态站（nginx），`docker compose` 一键启动。

## 快速开始

```bash
cd deploy

# 可选：设置生产密钥（不设置则用默认值，仅适合本地试运行）
# echo "JWT_SECRET=$(openssl rand -hex 32)" > .env

# 构建并启动
docker compose up -d --build

# 查看状态 / 日志
docker compose ps
docker compose logs -f backend
```

- 前端访问：http://localhost:8080
- 后端健康检查：`curl http://localhost:8080/api/health`（经 nginx 代理）
- 停止：`docker compose down`（`./data` 保留，数据不丢）

## 环境变量

| 变量 | 服务 | 说明 | 默认值 |
|------|------|------|--------|
| `PORT` | backend | API 监听端口 | `4000` |
| `DATABASE_URL` | backend | Prisma 连接串 | `file:/data/app.db` |
| `JWT_SECRET` | backend | JWT 签名密钥 | `change-me-in-production`（生产必须换） |
| `VITE_API_URL` | web（构建参数） | 前端 API 基地址 | `/api`（走同域 nginx 代理） |

`JWT_SECRET` 支持通过 `deploy/.env` 注入（compose 自动读取同目录 `.env`）：
```bash
echo "JWT_SECRET=你的随机长字符串" > deploy/.env
```

## SQLite 数据持久化

- compose 把宿主 `./data` 挂载到 backend 容器的 `/data`，`DATABASE_URL=file:/data/app.db`。
- 容器重建、镜像更新都不会丢数据；备份只需拷贝 `deploy/data/app.db`。
- 首次启动时 entrypoint 会自动执行 `prisma db push` 建表，无需手工初始化。
- 注意：`deploy/data/` 目录需要可写（容器内以 `node` 非 root 用户运行）。

## 换 Postgres（三步，生产推荐）

1. **起数据库**：取消 `docker-compose.yml` 底部 `db` 服务与 `pgdata` volume 的注释，
   在 `deploy/.env` 设置 `POSTGRES_PASSWORD`，让 backend `depends_on` 加上 `db`。
2. **改连接串**：backend 的 `DATABASE_URL` 改为
   `postgresql://monorepo:<密码>@db:5432/monorepo?schema=public`。
3. **改 Prisma provider**：`database/prisma/schema.prisma` 中 `provider = "postgresql"`，
   并用 `database/migrations/001_init.sql` 的 Postgres 版本建表
   （把 `datetime('now')` 换成 `now()`，文件底部附了完整语句）。

改完后 `docker compose up -d --build` 重新构建 backend 镜像即可
（Dockerfile 构建阶段的 `prisma generate` 会按新 provider 生成 client）。

## 镜像说明

| 镜像 | 基镜像 | 要点 |
|------|--------|------|
| backend | `node:20-alpine` | npm workspaces 安装 backend+shared；构建阶段 `prisma generate`；启动时 `prisma db push` 再 `node backend/dist/server.js`；以 `node` 非 root 用户运行；EXPOSE 4000 |
| web | `node:20-alpine` 构建 + `nginx:alpine` 运行 | `VITE_API_URL` 构建参数；产物拷贝到 `/usr/share/nginx/html`；`nginx.conf` 做 SPA fallback 与 `/api/` 反向代理 |

构建契约（与前后端目录的约定）：
- `npm run build --workspace=@monorepo/shared` 先行，产物在 `shared/dist`
- `npm run build --workspace=backend` 产物为 `backend/dist/server.js`
- `npm run build --workspace=frontend` 产物为 `frontend/dist/`
- 后端必须实现 `GET /api/health` 返回 200（compose healthcheck 依赖）
- backend 的 devDependencies 需包含 `prisma` CLI（启动时 `db push` 用）
