import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

/**
 * 把 DATABASE_URL 中的相对 file: 路径按 backend/ 目录解析。
 * Prisma CLI 默认相对 schema.prisma 所在目录解析，而文档约定的默认值
 * `file:../database/dev.db` 是相对于 backend/ 的，这里统一口径。
 */
function resolveDatabaseUrl(url: string): string {
  const prefix = 'file:';
  if (!url.startsWith(prefix)) {
    return url;
  }
  const rawPath = url.slice(prefix.length);
  if (rawPath.startsWith('/')) {
    return url;
  }
  return `${prefix}${resolve(process.cwd(), rawPath)}`;
}

declare global {
  // 缓存单例，防止 dev 热重载 / 测试重复 import 时创建多个连接池。
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  return new PrismaClient({ datasourceUrl: resolveDatabaseUrl(config.DATABASE_URL) });
}

export const prisma: PrismaClient = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}
