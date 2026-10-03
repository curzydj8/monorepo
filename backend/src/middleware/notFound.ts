import type { NextFunction, Request, Response } from 'express';
import { NotFoundError } from '../errors.js';

/** 未匹配任何路由时统一返回 404 NOT_FOUND。 */
export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError('接口不存在'));
}
