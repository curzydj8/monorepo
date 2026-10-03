import { afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { ApiResponse, AuthPayload, User } from '@monorepo/shared';
import { createApp } from '../src/app.js';
import { prisma } from '../src/db.js';

const app = createApp();

const alice = { email: 'alice@example.com', password: 'password123', name: 'Alice' };

function asSuccess<T>(body: unknown): T {
  const resp = body as ApiResponse<T>;
  if (!resp.success) {
    throw new Error(`期望成功响应，实际收到: ${JSON.stringify(resp)}`);
  }
  return resp.data;
}

function asFailure(body: unknown): { code: string; message: string } {
  const resp = body as ApiResponse<never>;
  if (resp.success) {
    throw new Error(`期望失败响应，实际收到: ${JSON.stringify(resp)}`);
  }
  return resp.error;
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('201：注册成功，返回用户与 token，且不泄露 passwordHash', async () => {
    const res = await request(app).post('/api/auth/register').send(alice);
    expect(res.status).toBe(201);

    const data = asSuccess<AuthPayload>(res.body);
    expect(data.user.email).toBe(alice.email);
    expect(data.user.name).toBe(alice.name);
    expect(typeof data.user.id).toBe('string');
    expect(typeof data.user.createdAt).toBe('string');
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(0);
    expect('passwordHash' in data.user).toBe(false);
  });

  it('409：重复邮箱注册，code=CONFLICT', async () => {
    const res = await request(app).post('/api/auth/register').send(alice);
    expect(res.status).toBe(409);
    expect(asFailure(res.body).code).toBe('CONFLICT');
  });

  it('400：邮箱格式非法，code=VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'password123', name: 'Bob' });
    expect(res.status).toBe(400);
    expect(asFailure(res.body).code).toBe('VALIDATION_ERROR');
  });

  it('400：密码不足 8 位，code=VALIDATION_ERROR', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bob@example.com', password: 'short', name: 'Bob' });
    expect(res.status).toBe(400);
    expect(asFailure(res.body).code).toBe('VALIDATION_ERROR');
  });

  it('400：缺少必填字段，code=VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'c@example.com' });
    expect(res.status).toBe(400);
    expect(asFailure(res.body).code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  it('200：登录成功，返回用户与 token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: alice.password });
    expect(res.status).toBe(200);

    const data = asSuccess<AuthPayload>(res.body);
    expect(data.user.email).toBe(alice.email);
    expect(typeof data.token).toBe('string');
    expect('passwordHash' in data.user).toBe(false);
  });

  it('401：密码错误，code=UNAUTHORIZED', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(asFailure(res.body).code).toBe('UNAUTHORIZED');
  });

  it('401：邮箱不存在，code=UNAUTHORIZED（不枚举用户）', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(asFailure(res.body).code).toBe('UNAUTHORIZED');
  });

  it('400：请求体校验失败，code=VALIDATION_ERROR', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad' });
    expect(res.status).toBe(400);
    expect(asFailure(res.body).code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/me', () => {
  it('200：携带有效 token 返回当前用户', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: alice.email, password: alice.password });
    const token = asSuccess<AuthPayload>(loginRes.body).token;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    const user = asSuccess<User>(res.body);
    expect(user.email).toBe(alice.email);
    expect('passwordHash' in user).toBe(false);
  });

  it('401：无 Authorization 头，code=UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(asFailure(res.body).code).toBe('UNAUTHORIZED');
  });

  it('401：token 被篡改，code=UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(asFailure(res.body).code).toBe('UNAUTHORIZED');
  });

  it('404：token 有效但用户已被删除，code=NOT_FOUND', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ghost@example.com', password: 'password123', name: 'Ghost' });
    const { user, token } = asSuccess<AuthPayload>(regRes.body);
    await prisma.user.delete({ where: { id: user.id } });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(asFailure(res.body).code).toBe('NOT_FOUND');
  });

  it('401：Authorization 非 Bearer 格式，code=UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Token abc123');
    expect(res.status).toBe(401);
    expect(asFailure(res.body).code).toBe('UNAUTHORIZED');
  });

  it('401：Bearer 后为空 token，code=UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer ');
    expect(res.status).toBe(401);
    expect(asFailure(res.body).code).toBe('UNAUTHORIZED');
  });
});

describe('GET /api/health', () => {
  it('200：返回 {status:"ok"}', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(asSuccess<{ status: string }>(res.body)).toEqual({ status: 'ok' });
  });
});

describe('未匹配路由', () => {
  it('404：code=NOT_FOUND', async () => {
    const res = await request(app).get('/api/no-such-route');
    expect(res.status).toBe(404);
    expect(asFailure(res.body).code).toBe('NOT_FOUND');
  });

  it('400：畸形 JSON 请求体被识别为客户端错误', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": broken}');
    expect(res.status).toBe(400);
    expect(asFailure(res.body).code).toBe('VALIDATION_ERROR');
  });
});
