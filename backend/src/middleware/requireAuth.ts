import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors.js';
import { verifyToken } from '../services/token.service.js';

/**
 * Bearer Token 认证中间件：解析 Authorization 头，校验通过后挂载 req.user。
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header === undefined || !header.startsWith('Bearer ')) {
    next(new UnauthorizedError('缺少身份凭证'));
    return;
  }
  const token = header.slice('Bearer '.length).trim();
  if (token.length === 0) {
    next(new UnauthorizedError('缺少身份凭证'));
    return;
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new UnauthorizedError('身份凭证无效或已过期'));
  }
}
