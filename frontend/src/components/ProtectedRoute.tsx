import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/** 未登录时重定向到 /login，已登录则渲染子路由。 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
