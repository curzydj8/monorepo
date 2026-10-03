import type { AuthPayload, LoginInput, RegisterInput, User } from '@monorepo/shared';
import { apiFetch } from './client';

/** 注册：成功返回新建的用户（不含 token，需再登录）。后端 data 为 {user} 结构。 */
export async function register(input: RegisterInput): Promise<User> {
  const payload = await apiFetch<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: input,
  });
  return payload.user;
}

/** 登录：成功返回用户与 token。 */
export async function login(input: LoginInput): Promise<AuthPayload> {
  return apiFetch<AuthPayload>('/api/auth/login', { method: 'POST', body: input });
}

/** 用 token 恢复当前登录用户。后端 data 为 {user} 结构。 */
export async function fetchMe(token: string): Promise<User> {
  const payload = await apiFetch<{ user: User }>('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return payload.user;
}

/** 后端健康检查，返回原始载荷由调用方收窄。 */
export async function fetchHealth(): Promise<unknown> {
  return apiFetch<unknown>('/api/health');
}
