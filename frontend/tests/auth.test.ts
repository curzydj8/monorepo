import { describe, expect, it } from 'vitest';
import { fetchHealth, fetchMe, login, register } from '../src/api/auth';
import { ApiClientError } from '../src/api/client';
import { TEST_TOKEN, TEST_USER } from './mocks/handlers';

describe('auth api', () => {
  it('login 成功时返回 user 与 token', async () => {
    const payload = await login({ email: TEST_USER.email, password: 'password123' });
    expect(payload.user).toEqual(TEST_USER);
    expect(payload.token).toBe(TEST_TOKEN);
  });

  it('login 密码错误时抛出 UNAUTHORIZED', async () => {
    await expect(login({ email: TEST_USER.email, password: 'wrong' })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  it('register 成功时返回新建用户', async () => {
    const user = await register({
      name: '新用户',
      email: 'new@example.com',
      password: 'password123',
    });
    expect(user.email).toBe('new@example.com');
    expect(user.name).toBe('新用户');
    expect(user.id).toBeTruthy();
  });

  it('register 邮箱已存在时抛出 CONFLICT', async () => {
    const promise = register({
      name: '重复用户',
      email: 'exists@example.com',
      password: 'password123',
    });
    await expect(promise).rejects.toBeInstanceOf(ApiClientError);
    await expect(promise).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('fetchMe 携带有效 token 时返回用户', async () => {
    const user = await fetchMe(TEST_TOKEN);
    expect(user).toEqual(TEST_USER);
  });

  it('fetchMe 携带无效 token 时抛出 UNAUTHORIZED', async () => {
    await expect(fetchMe('bad-token')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('fetchHealth 返回健康载荷', async () => {
    const payload: unknown = await fetchHealth();
    expect(payload).toEqual({ status: 'ok' });
  });
});
