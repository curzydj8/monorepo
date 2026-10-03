import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { RegisterPage } from '../src/pages/RegisterPage';
import { useAuthStore } from '../src/store/auth';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <LocationProbe />
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>登录页</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null });
  localStorage.clear();
});

describe('RegisterPage', () => {
  it('渲染标题与姓名/邮箱/密码输入框', () => {
    renderRegisterPage();
    expect(screen.getByRole('heading', { name: '注册' })).toBeInTheDocument();
    expect(screen.getByLabelText('姓名')).toBeInTheDocument();
    expect(screen.getByLabelText('邮箱')).toBeInTheDocument();
    expect(screen.getByLabelText('密码')).toBeInTheDocument();
  });

  it('空提交时显示 zod 校验错误', async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    await user.click(screen.getByRole('button', { name: '注册' }));
    expect(await screen.findByText('姓名不能为空')).toBeInTheDocument();
    expect(await screen.findByText('邮箱格式不正确')).toBeInTheDocument();
    expect(await screen.findByText('密码至少 8 位')).toBeInTheDocument();
  });

  it('注册成功后导航到登录页', async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    await user.type(screen.getByLabelText('姓名'), '新用户');
    await user.type(screen.getByLabelText('邮箱'), 'new@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '注册' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login');
    });
    expect(screen.getByText('登录页')).toBeInTheDocument();
  });

  it('邮箱已注册时显示后端冲突错误', async () => {
    const user = userEvent.setup();
    renderRegisterPage();
    await user.type(screen.getByLabelText('姓名'), '重复用户');
    await user.type(screen.getByLabelText('邮箱'), 'exists@example.com');
    await user.type(screen.getByLabelText('密码'), 'password123');
    await user.click(screen.getByRole('button', { name: '注册' }));

    expect(await screen.findByText('该邮箱已被注册')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/register');
  });
});
