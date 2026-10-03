import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { config } from '../src/config.js';
import { signToken, verifyToken } from '../src/services/token.service.js';

describe('token.service', () => {
  it('sign/verify 往返：载荷中的 sub 与 email 一致', () => {
    const token = signToken('user-123', 'a@example.com');
    const payload = verifyToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.email).toBe('a@example.com');
  });

  it('签名被篡改的 token 校验失败', () => {
    const token = signToken('user-123', 'a@example.com');
    const tampered = `${token.slice(0, -2)}xx`;
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('用错误密钥签发的 token 校验失败', () => {
    const foreign = jwt.sign({ sub: 'x', email: 'x@y.z' }, 'wrong-secret-key-0123456789');
    expect(() => verifyToken(foreign)).toThrow();
  });

  it('过期的 token 校验失败', () => {
    const expired = jwt.sign(
      { sub: 'x', email: 'x@y.z', exp: Math.floor(Date.now() / 1000) - 10 },
      config.JWT_SECRET,
    );
    expect(() => verifyToken(expired)).toThrow();
  });

  it('载荷缺 sub/email 字段时抛错', () => {
    const bad = jwt.sign({ foo: 'bar' }, config.JWT_SECRET);
    expect(() => verifyToken(bad)).toThrow('Token 载荷非法');
  });

  it('完全非法的 token 字符串抛错', () => {
    expect(() => verifyToken('not-a-token')).toThrow();
  });
});
