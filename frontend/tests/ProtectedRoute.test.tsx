import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { useAuthStore } from '../src/store/auth';
import { TEST_TOKEN, TEST_USER } from './mocks/handlers';

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<div>登录页</div>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>受保护内容</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null });
  localStorage.clear();
});

describe('ProtectedRoute', () => {
  it('未登录时重定向到 /login', () => {
    renderProtected();
    expect(screen.getByText('登录页')).toBeInTheDocument();
    expect(screen.queryByText('受保护内容')).not.toBeInTheDocument();
  });

  it('已登录时渲染子内容', () => {
    useAuthStore.setState({ user: TEST_USER, token: TEST_TOKEN });
    renderProtected();
    expect(screen.getByText('受保护内容')).toBeInTheDocument();
  });
});
