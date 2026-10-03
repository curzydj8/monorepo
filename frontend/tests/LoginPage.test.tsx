import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { LoginPage } from '../src/pages/LoginPage';
import { useAuthStore } from '../src/store/auth';
import { TEST_USER } from './mocks/handlers';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LocationProbe />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>首页</div>} />
        <Route path="/register" element={<div>注册页</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null });
  localStorage.clear();
});

describe('LoginPage', () => {
  it('渲染标题与邮箱/密码输入框', () => {
    renderLoginPage();
    expect(screen.getByRole('heading', { name: '登录' })).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
  });

  it('空提交时显示 zod 校验错误', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.click(screen.getByRole('button', { name: '登录' }));
    expect(await screen.findByText('邮箱格式不正确')).toBeInTheDocument();
    expect(await screen.findByText('密码不能为空')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });

  it('邮箱格式错误时显示对应校验信息', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.type(screen.getByLabelText('邮箱'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: '登录' }));
    expect(await screen.findByText('邮箱格式不正确')).toBeInTheDocument();
  });

  it('正确填写并提交后导航到首页且 store 保存会话', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.type(screen.getByLabelText('邮箱'), TEST_USER.email);
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '登录' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/');
    });
    expect(screen.getByText('首页')).toBeInTheDocument();
    expect(useAuthStore.getState().token).toBeTruthy();
    expect(useAuthStore.getState().user?.email).toBe(TEST_USER.email);
  });

  it('密码错误时显示后端错误信息且不导航', async () => {
    const user = userEvent.setup();
    renderLoginPage();
    await user.type(screen.getByLabelText('邮箱'), TEST_USER.email);
    await user.type(screen.getByLabelText('密码'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: '登录' }));

    expect(await screen.findByText('邮箱或密码错误')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
    expect(useAuthStore.getState().token).toBeNull();
  });
});
