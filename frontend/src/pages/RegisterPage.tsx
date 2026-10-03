import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '@monorepo/shared';
import type { RegisterInput } from '@monorepo/shared';
import { ApiClientError } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, ErrorAlert, TextInput } from '../components/ui';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: doRegister } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (input: RegisterInput): Promise<void> => {
    setSubmitError(null);
    try {
      await doRegister(input);
      navigate('/login', { replace: true });
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.message : '注册失败，请稍后重试');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-900">注册</h1>
        {submitError && <ErrorAlert message={submitError} />}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextInput
            label="姓名"
            type="text"
            autoComplete="name"
            placeholder="请输入姓名"
            error={errors.name?.message}
            {...register('name')}
          />
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
            autoComplete="new-password"
            placeholder="至少 8 位"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? '注册中…' : '注册'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          已有账号？
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            去登录
          </Link>
        </p>
      </Card>
    </div>
  );
}
