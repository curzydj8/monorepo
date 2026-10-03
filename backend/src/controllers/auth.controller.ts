import type { Request, Response } from 'express';
import type { ApiResponse, AuthPayload, LoginInput, RegisterInput, User } from '@monorepo/shared';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { UnauthorizedError } from '../errors.js';
import * as authService from '../services/auth.service.js';

/** POST /api/auth/register → 201 {user, token}（请求体已由 validateBody 收窄）。 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.register(req.body as RegisterInput);
  const body: ApiResponse<AuthPayload> = { success: true, data: result };
  res.status(201).json(body);
});

/** POST /api/auth/login → 200 {user, token}。 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body as LoginInput);
  const body: ApiResponse<AuthPayload> = { success: true, data: result };
  res.status(200).json(body);
});

/** GET /api/auth/me → 200 {user}（需 requireAuth 前置）。 */
export const me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (req.user === undefined) {
    throw new UnauthorizedError('缺少身份凭证');
  }
  const user = await authService.getMe(req.user.id);
  const body: ApiResponse<User> = { success: true, data: user };
  res.status(200).json(body);
});
