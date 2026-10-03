import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config.js';

export interface TokenPayload {
  sub: string;
  email: string;
}

/** 签发 JWT：sub=用户 id。纯函数逻辑，便于单元测试。 */
export function signToken(userId: string, email: string): string {
  const payload: TokenPayload = { sub: userId, email };
  const options: SignOptions = { expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, config.JWT_SECRET, options);
}

/**
 * 校验 JWT 并做运行时收窄：签名错误、过期、载荷缺字段一律抛错，
 * 由调用方统一转为 UnauthorizedError。
 */
export function verifyToken(token: string): TokenPayload {
  const decoded: unknown = jwt.verify(token, config.JWT_SECRET);
  if (typeof decoded !== 'object' || decoded === null) {
    throw new Error('Token 载荷非法');
  }
  const record = decoded as Record<string, unknown>;
  const sub = record['sub'];
  const email = record['email'];
  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Token 载荷非法');
  }
  return { sub, email };
}
