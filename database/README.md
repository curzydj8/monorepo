# database/ — 数据层说明

本目录是数据库的**唯一事实源头**，包含两部分：

| 文件 | 作用 |
|------|------|
| `prisma/schema.prisma` | Prisma ORM 模型定义，backend 通过 `@prisma/client` 访问数据库 |
| `migrations/*.sql` | 原生 SQL 迁移脚本，按编号顺序执行，用于评审、审计与手工建表 |

## 本地开发工作流（SQLite，零配置）

1. 设置环境变量（backend/.env 或 shell）：
   ```bash
   DATABASE_URL="file:./dev.db"
   ```
2. 同步表结构（开发期直接推 schema，无需写迁移）：
   ```bash
   npx prisma db push --schema database/prisma/schema.prisma
   ```
3. 需要手写原生 SQL 时，把语句追加为新的迁移文件：
   `migrations/002_xxx.sql`、`003_xxx.sql`……编号递增，**已提交的迁移文件永不修改**。

> 规则：`migrations/*.sql` 是评审与审计的源头。任何表结构变更都要先写 SQL
> 迁移文件，再同步更新 `schema.prisma`，两者必须一致。

## 切换到 Postgres（生产）

三步：

1. 改 `prisma/schema.prisma`：
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. 换连接串，例如：
   ```bash
   DATABASE_URL="postgresql://user:password@db:5432/monorepo?schema=public"
   ```
3. 用迁移 SQL 建表（注意把 `datetime('now')` 换成 `now()`，`001_init.sql` 底部附了 Postgres 版本）：
   ```bash
   psql "$DATABASE_URL" -f database/migrations/001_init.sql
   ```

docker-compose 部署时换 Postgres 的完整步骤见 `deploy/README.md`。
