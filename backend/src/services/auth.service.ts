import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { LoginInput, RegisterInput, User } from '@monorepo/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../db.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../errors.js';
import { signToken } from './token.service.js';

const BCRYPT_ROUNDS = 10;

interface UserRow {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/** 数据库行 → 对外 User：Date 转 ISO 字符串，绝不携带 passwordHash。 */
function toPublicUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface AuthResult {
  user: User;
  token: string;
}

/** 注册：邮箱去重 → bcrypt 10 轮哈希 → 落库 → 返回用户与 token。 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing !== null) {
    throw new ConflictError('该邮箱已被注册');
  }
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  try {
    const created = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: input.email,
        passwordHash,
        name: input.name,
        createdAt: new Date(),
      },
    });
    const user = toPublicUser(created);
    return { user, token: signToken(user.id, user.email) };
  } catch (err: unknown) {
    // 并发注册竞态兜底：唯一约束冲突同样转为 409。
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('该邮箱已被注册');
    }
    throw err;
  }
}

/** 登录：邮箱不存在与密码错误返回相同的 401，避免枚举用户。 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const found = await prisma.user.findUnique({ where: { email: input.email } });
  if (found === null) {
    throw new UnauthorizedError('邮箱或密码错误');
  }
  const matched = await bcrypt.compare(input.password, found.passwordHash);
  if (!matched) {
    throw new UnauthorizedError('邮箱或密码错误');
  }
  const user = toPublicUser(found);
  return { user, token: signToken(user.id, user.email) };
}

/** 按 id 取当前用户：不存在抛 404（token 有效但用户已被删除的场景）。 */
export async function getMe(userId: string): Promise<User> {
  const found = await prisma.user.findUnique({ where: { id: userId } });
  if (found === null) {
    throw new NotFoundError('用户不存在');
  }
  return toPublicUser(found);
}
