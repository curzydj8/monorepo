import { Link } from 'react-router-dom';
import { Card } from '../components/ui';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-6xl font-bold text-slate-300">404</h1>
        <p className="mt-4 text-lg font-medium text-slate-700">页面不存在</p>
        <p className="mt-2 text-sm text-slate-500">你访问的页面已被移动或删除。</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          返回首页
        </Link>
      </Card>
    </div>
  );
}
