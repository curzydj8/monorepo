#!/bin/sh
# 后端容器启动入口：先同步数据库表结构，再启动 Node 服务。
# DATABASE_URL / PORT 由运行环境注入（见 deploy/docker-compose.yml）。
set -eu

echo "[entrypoint] applying database schema via prisma db push..."
npx prisma db push --schema ./database/prisma/schema.prisma --skip-generate

echo "[entrypoint] starting backend on port ${PORT:-4000}..."
exec node backend/dist/server.js
