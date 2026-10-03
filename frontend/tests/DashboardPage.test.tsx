import { http, HttpResponse } from 'msw';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { DashboardPage } from '../src/pages/DashboardPage';
import { useAuthStore } from '../src/store/auth';
import { TEST_TOKEN, TEST_USER } from './mocks/handlers';
import { server } from './mocks/server';

const API_BASE = 'http://localhost:4000';

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null });
  localStorage.clear();
});

describe('DashboardPage', () => {
  it('展示用户姓名/邮箱与后端正常状态', async () => {
    const user = userEvent.setup();
    useAuthStore.setState({ user: TEST_USER, token: TEST_TOKEN });
    renderDashboard();

    expect(screen.getByText(`欢迎回来，${TEST_USER.name}`)).toBeInTheDocument();
    expect(screen.getByText(TEST_USER.email)).toBeInTheDocument();
    expect(screen.getByText('正在检查后端服务…')).toBeInTheDocument();
    expect(await screen.findByText('后端运行正常')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '退出登录' }));
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('后端健康检查失败时显示不可用状态与错误信息', async () => {
    server.use(
      http.get(`${API_BASE}/api/health`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: '服务异常' } },
          { status: 500 },
        ),
      ),
    );
    useAuthStore.setState({ user: TEST_USER, token: TEST_TOKEN });
    renderDashboard();

    expect(await screen.findByText('后端不可用')).toBeInTheDocument();
    expect(await screen.findByText('服务异常')).toBeInTheDocument();
  });

  it('健康载荷格式异常时显示不可用状态', async () => {
    server.use(
      http.get(`${API_BASE}/api/health`, () =>
        HttpResponse.json({ success: true, data: { unexpected: 1 } }),
      ),
    );
    useAuthStore.setState({ user: TEST_USER, token: TEST_TOKEN });
    renderDashboard();

    expect(await screen.findByText('后端不可用')).toBeInTheDocument();
  });
});
