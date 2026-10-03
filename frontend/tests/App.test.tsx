import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { App, AppRoutes } from '../src/App';
import { useAuthStore } from '../src/store/auth';
import { TEST_TOKEN, TEST_USER } from './mocks/handlers';

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null });
  localStorage.clear();
});

describe('App 路由', () => {
  it('/login 渲染登录页', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
  });

  it('/register 渲染注册页', () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: '注册' })).toBeInTheDocument();
  });

  it('未登录访问 / 时重定向到登录页', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
  });

  it('未知路径渲染 404 页', () => {
    render(
      <MemoryRouter initialEntries={['/not-exists']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByText('页面不存在')).toBeInTheDocument();
  });

  it('App 组件使用 BrowserRouter 正常挂载', () => {
    render(<App />);
    // jsdom 默认路径为 /，未登录应重定向到登录页
    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
  });
});
