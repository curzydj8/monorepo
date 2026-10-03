import type { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

/**
 * 异步路由包装器：把 async handler 的 rejection 转交给错误中间件，
 * 避免每个 controller 重复写 try/catch。
 */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const run = async (): Promise<void> => {
      try {
        await handler(req, res, next);
      } catch (err: unknown) {
        next(err);
      }
    };
    void run();
  };
}
