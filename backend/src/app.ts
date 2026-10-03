import express from 'express';
import authRoutes from './routes/auth.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';

/** Express 实例工厂：测试可复用，避免多实例监听端口。 */
export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/health', healthRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
