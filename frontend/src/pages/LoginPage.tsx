import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '@monorepo/shared';
import type { LoginInput } from '@monorepo/shared';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, ErrorAlert, TextInput } from '../components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (input: LoginInput): Promise<void> => {
    setSubmitError(null);
    try {
      await login(input);
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : '登录失败，请稍后重试');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">登录</h1>
        {submitError && <ErrorAlert message={submitError} />}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextInput
            label="邮箱"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <TextInput
            label="密码"
            type="password"
            autoComplete="current-password"
            placeholder="请输入密码"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? '登录中…' : '登录'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          还没有账号？
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            去注册
          </Link>
        </p>
      </Card>
    </div>
  );
}
