import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiClientError } from '../src/api/client';
import { useAuth } from '../src/hooks/useAuth';
import { TOKEN_STORAGE_KEY, useAuthStore } from '../src/store/auth';
import { TEST_TOKEN, TEST_USER } from './mocks/handlers';

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null });
  localStorage.clear();
});

describe('useAuth', () => {
  it('无 token 时不发起恢复请求，直接返回未登录态', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('有有效 token 时通过 fetchMe 恢复会话', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, TEST_TOKEN);
    // 重新初始化 store 以读取 localStorage（模块加载时已读过一次）
    useAuthStore.setState({ user: null, token: TEST_TOKEN });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.user).toEqual(TEST_USER);
    });
    expect(result.current.loading).toBe(false);
  });

  it('token 失效时清理本地会话', async () => {
    useAuthStore.setState({ user: null, token: 'expired-token' });
    localStorage.setItem(TOKEN_STORAGE_KEY, 'expired-token');

    const { result } = renderHook(() => useAuth());
    await waitFor(() => {
      expect(result.current.token).toBeNull();
    });
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('login 成功后写入 store', async () => {
    const { result } = renderHook(() => useAuth());
    let returned;
    await act(async () => {
      returned = await result.current.login({ email: TEST_USER.email, password: 'password123' });
    });
    expect(returned).toEqual(TEST_USER);
    expect(useAuthStore.getState().token).toBe(TEST_TOKEN);
  });

  it('login 失败时抛出错误且不写 store', async () => {
    const { result } = renderHook(() => useAuth());
    let caught: unknown;
    // 错误必须在 act 回调内部捕获：让 act 回调本身不 reject，
    // 否则 React 的 act 环境状态错乱会影响后续测试
    await act(async () => {
      try {
        await result.current.login({ email: TEST_USER.email, password: 'wrong' });
      } catch (err) {
        caught = err;
      }
    });
    expect(caught).toBeInstanceOf(ApiClientError);
    expect(caught).toMatchObject({ code: 'UNAUTHORIZED' });
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('register 返回新建用户', async () => {
    const { result } = renderHook(() => useAuth());
    let returned;
    await act(async () => {
      returned = await result.current.register({
        name: '新用户',
        email: 'new2@example.com',
        password: 'password123',
      });
    });
    expect(returned).toMatchObject({ email: 'new2@example.com' });
  });

  it('logout 清空会话', async () => {
    useAuthStore.setState({ user: TEST_USER, token: TEST_TOKEN });
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.logout();
    });
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });
});
