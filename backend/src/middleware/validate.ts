import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../errors.js';

/**
 * 请求体校验中间件：用共享的 Zod schema 做运行时收窄，
 * 失败抛 ValidationError（details 携带 zod issues），成功后把收窄结果写回 req.body。
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationError('请求参数校验失败', result.error.issues));
      return;
    }
    req.body = result.data;
    next();
  };
}
