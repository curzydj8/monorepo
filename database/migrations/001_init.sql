-- 001_init.sql — 初始建表迁移（users 表）
-- 目标：SQLite（本地开发 / docker-compose 默认）。Postgres 版本见文件底部注释。
-- 约定：SQL 迁移文件是评审与审计的源头；Prisma schema 只是 ORM 映射层，
-- 两者变更必须同步（改了 schema.prisma 就要手写一条新的迁移 SQL）。

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,                       -- UUID 字符串（应用层生成）
  email         TEXT NOT NULL UNIQUE,                   -- 登录邮箱，唯一
  password_hash TEXT NOT NULL,                           -- 密码哈希（scrypt/bcrypt），永不存明文
  name          TEXT NOT NULL,                           -- 显示名
  created_at    TEXT NOT NULL DEFAULT (datetime('now')), -- ISO8601 UTC
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))  -- 应用层每次更新时刷新
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ---------------------------------------------------------------------------
-- Postgres 版本（切换 provider=postgresql 时使用，把上面替换为下面）：
--
-- CREATE TABLE IF NOT EXISTS users (
--   id            TEXT PRIMARY KEY,
--   email         TEXT NOT NULL UNIQUE,
--   password_hash TEXT NOT NULL,
--   name          TEXT NOT NULL,
--   created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
--   updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
-- );
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- ---------------------------------------------------------------------------
