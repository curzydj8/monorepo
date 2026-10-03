import { useCallback, useEffect, useState } from 'react';
import type { LoginInput, RegisterInput, User } from '@monorepo/shared';
import { fetchMe, login as apiLogin, register as apiRegister } from '../api/auth';
import { useAuthStore } from '../store/auth';

export interface UseAuthResult {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<User>;
  logout: () => void;
  register: (input: RegisterInput) => Promise<User>;
}

/**
 * 认证业务 hook：封装"启动时用已存 token 恢复会话"的逻辑。
 * 页面/组件只消费这个 hook，不直接碰 store 与 api。
 */
export function useAuth(): UseAuthResult {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      if (!token || user) return;
      setLoading(true);
      try {
        const me = await fetchMe(token);
        if (!cancelled) setUser(me);
      } catch {
        // token 失效或过期：清理本地会话，回到未登录态
        if (!cancelled) storeLogout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, [token, user, setUser, storeLogout]);

  const login = useCallback(
    async (input: LoginInput): Promise<User> => {
      const payload = await apiLogin(input);
      storeLogin(payload.user, payload.token);
      return payload.user;
    },
    [storeLogin],
  );

  const register = useCallback(async (input: RegisterInput): Promise<User> => {
    return apiRegister(input);
  }, []);

  return { user, token, loading, login, logout: storeLogout, register };
}
