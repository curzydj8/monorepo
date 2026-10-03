import { useEffect, useState } from 'react';
import { fetchHealth } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, ErrorAlert } from '../components/ui';

type HealthState = 'loading' | 'ok' | 'error';

/** unknown 收窄：健康检查载荷是否为 { status: string }。 */
function isHealthPayload(value: unknown): value is { status: string } {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return typeof record.status === 'string';
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthState>('loading');
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkHealth(): Promise<void> {
      try {
        const payload = await fetchHealth();
        if (!cancelled) {
          setHealth(isHealthPayload(payload) ? 'ok' : 'error');
        }
      } catch (err) {
        if (!cancelled) {
          setHealth('error');
          setHealthError(err instanceof Error ? err.message : '健康检查失败');
        }
      }
    }

    void checkHealth();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">欢迎回来，{user?.name ?? '用户'}</h1>
              <p className="mt-1 text-sm text-slate-600">{user?.email ?? ''}</p>
            </div>
            <Button variant="secondary" onClick={logout}>
              退出登录
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">后端服务状态</h2>
          {health === 'loading' && <p className="text-sm text-slate-500">正在检查后端服务…</p>}
          {health === 'ok' && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500" />
              后端运行正常
            </span>
          )}
          {health === 'error' && (
            <div>
              <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                后端不可用
              </span>
              {healthError && <ErrorAlert message={healthError} />}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
