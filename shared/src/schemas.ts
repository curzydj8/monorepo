import { z } from 'zod';

/** 注册输入校验：前后端共用同一份 schema，保证校验规则一致。 */
export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位').max(72, '密码过长'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名过长'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
});

export type LoginInput = z.infer<typeof loginSchema>;
