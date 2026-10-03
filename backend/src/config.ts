import dotenv from 'dotenv';
import { z } from 'zod';

// 入口最早加载的模块之一：在这里加载 .env，保证后续读取 process.env 时已就绪。
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1).default('file:../database/dev.db'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET 至少需要 16 位'),
  JWT_EXPIRES_IN: z.string().min(1).default('1h'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type AppConfig = z.infer<typeof envSchema>;

/** 启动时即校验环境变量：缺失或非法直接抛错，拒绝带病启动。 */
export const config: AppConfig = envSchema.parse(process.env);
