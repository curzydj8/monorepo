import { beforeEach, describe, expect, it } from 'vitest';
import { TOKEN_STORAGE_KEY, useAuthStore } from '../src/store/auth';
import { TEST_TOKEN, TEST_USER } from './mocks/handlers';

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null });
  localStorage.clear();
});

describe('auth store', () => {
  it('login 写入用户与 token 并持久化到 localStorage', () => {
    useAuthStore.getState().login(TEST_USER, TEST_TOKEN);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(TEST_USER);
    expect(state.token).toBe(TEST_TOKEN);
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(TEST_TOKEN);
  });

  it('logout 清空用户与 token 并移除持久化', () => {
    useAuthStore.getState().login(TEST_USER, TEST_TOKEN);
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('setUser 只更新用户不影响 token', () => {
    useAuthStore.getState().login(TEST_USER, TEST_TOKEN);
    useAuthStore.getState().setUser(null);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBe(TEST_TOKEN);
  });
});
