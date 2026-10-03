import { config } from './config.js';
import { createApp } from './app.js';
import { prisma } from './db.js';

async function main(): Promise<void> {
  try {
    await prisma.$connect();
    const app = createApp();
    const server = app.listen(config.PORT, () => {
      console.log(`backend listening on port ${config.PORT} (${config.NODE_ENV})`);
    });

    const shutdown = async (signal: string): Promise<void> => {
      console.log(`收到 ${signal}，正在优雅关闭…`);
      await new Promise<void>((resolve) => {
        server.close(() => {
          resolve();
        });
      });
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGINT', () => {
      void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
      void shutdown('SIGTERM');
    });
  } catch (err: unknown) {
    console.error('服务启动失败:', err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason: unknown) => {
  console.error('未处理的 Promise rejection:', reason);
  process.exit(1);
});

void main();
