import { describe, expect, it } from 'vitest';
import type { Request, Response } from 'express';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { ConflictError, NotFoundError, ValidationError } from '../src/errors.js';

interface Captured {
  statusCode: number;
  body: unknown;
}

function capture(): { res: Response; out: Captured } {
  const out: Captured = { statusCode: 0, body: undefined };
  const res = {
    status(code: number): Response {
      out.statusCode = code;
      return this as unknown as Response;
    },
    json(payload: unknown): Response {
      out.body = payload;
      return this as unknown as Response;
    },
  } as unknown as Response;
  return { res, out };
}

function run(err: unknown): Captured {
  const { res, out } = capture();
  errorHandler(err, {} as Request, res, () => {});
  return out;
}

describe('errorHandler', () => {
  it('HttpError：状态码与 code 透出', () => {
    const out = run(new NotFoundError('没找到'));
    expect(out.statusCode).toBe(404);
    expect(out.body).toEqual({ success: false, error: { code: 'NOT_FOUND', message: '没找到' } });
  });

  it('ValidationError：details 透出', () => {
    const out = run(new ValidationError('参数错', [{ path: ['email'] }]));
    expect(out.statusCode).toBe(400);
    expect(out.body).toEqual({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: '参数错', details: [{ path: ['email'] }] },
    });
  });

  it('ConflictError：409', () => {
    const out = run(new ConflictError('已存在'));
    expect(out.statusCode).toBe(409);
    expect(out.body).toEqual({ success: false, error: { code: 'CONFLICT', message: '已存在' } });
  });

  it('未知 Error：500 INTERNAL_ERROR（测试环境透出原始 message）', () => {
    const out = run(new Error('boom'));
    expect(out.statusCode).toBe(500);
    expect(out.body).toEqual({ success: false, error: { code: 'INTERNAL_ERROR', message: 'boom' } });
  });

  it('非 Error 的 throw 值：500 INTERNAL_ERROR', () => {
    const out = run('string-throw');
    expect(out.statusCode).toBe(500);
    expect(out.body).toEqual({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: '服务器内部错误' },
    });
  });

  it('带 status 的第三方错误（如 body-parser）：按其状态码返回', () => {
    const err = new Error('Unexpected token');
    (err as unknown as Record<string, unknown>)['status'] = 400;
    const out = run(err);
    expect(out.statusCode).toBe(400);
    expect(out.body).toEqual({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Unexpected token' },
    });
  });
});
