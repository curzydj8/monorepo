import { http, HttpResponse } from 'msw';
import type { User } from '@monorepo/shared';

const API_BASE = 'http://localhost:4000';

const MOCK_USER: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: '测试用户',
  createdAt: '2026-10-03T00:00:00.000Z',
  updatedAt: '2026-10-03T00:00:00.000Z',
};

const MOCK_TOKEN = 'mock-jwt-token';

/** unknown 收窄：登录/注册请求体。 */
function isCredentialBody(value: unknown): value is { email: string; password: string } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.email === 'string' && typeof record.password === 'string';
}

function isRegisterBody(value: unknown): value is { email: string; password: string; name: string } {
  if (!isCredentialBody(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.name === 'string';
}

export const TEST_USER = MOCK_USER;
export const TEST_TOKEN = MOCK_TOKEN;

export const handlers = [
  http.post(`${API_BASE}/api/auth/login`, async ({ request }) => {
    const body: unknown = await request.json();
    if (isCredentialBody(body) && body.email === MOCK_USER.email && body.password === 'password123') {
      return HttpResponse.json({ success: true, data: { user: MOCK_USER, token: MOCK_TOKEN } });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '邮箱或密码错误' } },
      { status: 401 },
    );
  }),

  http.post(`${API_BASE}/api/auth/register`, async ({ request }) => {
    const body: unknown = await request.json();
    if (!isRegisterBody(body)) {
      return HttpResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '请求参数无效' } },
        { status: 400 },
      );
    }
    if (body.email === 'exists@example.com') {
      return HttpResponse.json(
        { success: false, error: { code: 'CONFLICT', message: '该邮箱已被注册' } },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      { success: true, data: { user: { ...MOCK_USER, email: body.email, name: body.name } } },
      { status: 201 },
    );
  }),

  http.get(`${API_BASE}/api/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth === `Bearer ${MOCK_TOKEN}`) {
      return HttpResponse.json({ success: true, data: { user: MOCK_USER } });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: '未授权' } },
      { status: 401 },
    );
  }),

  http.get(`${API_BASE}/api/health`, () => {
    return HttpResponse.json({ success: true, data: { status: 'ok' } });
  }),
];
