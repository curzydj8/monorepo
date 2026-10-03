import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdtempSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 确保 Prisma query engine 就位：
 * 受限网络下 `npm install` 无法下载引擎二进制，此处若检测到预下载的
 * 引擎（~/.cache/prisma-engines/），则复制到生成的 client 目录，
 * 并设置 PRISMA_QUERY_ENGINE_LIBRARY 兜底。普通网络下此函数无操作。
 */
function ensureQueryEngine(backendDir: string): void {
  const cached = join(homedir(), '.cache', 'prisma-engines', 'libquery_engine.so.node');
  if (!existsSync(cached)) {
    return;
  }
  process.env.PRISMA_QUERY_ENGINE_LIBRARY ??= cached;
  const dest = join(
    backendDir,
    '..',
    'node_modules',
    '.prisma',
    'client',
    'libquery_engine-debian-openssl-3.0.x.so.node',
  );
  if (!existsSync(dest)) {
    copyFileSync(cached, dest);
  }
}

const backendDir = fileURLToPath(new URL('..', import.meta.url));
ensureQueryEngine(backendDir);

/**
 * 测试前置：每个测试进程使用独立的临时 SQLite 库，
 * 必须在任何业务模块（app/db）被 import 之前写入 process.env，
 * 否则 PrismaClient 单例会连到开发库。
 */
const dir = mkdtempSync(join(tmpdir(), 'monorepo-backend-test-'));
const dbPath = join(dir, 'test.db');

process.env.DATABASE_URL = `file:${dbPath}`;
process.env.JWT_SECRET = 'test-secret-key-0123456789abcdef';
process.env.NODE_ENV = 'test';

// 初始化表结构（--skip-generate：client 已提前生成）。
// 走 scripts/prisma.sh 包装器：在受限网络下自动使用预下载引擎，普通网络走默认行为。
execSync('sh scripts/prisma.sh db push --schema ../database/prisma/schema.prisma --skip-generate', {
  cwd: backendDir,
  stdio: 'pipe',
  env: process.env,
});
