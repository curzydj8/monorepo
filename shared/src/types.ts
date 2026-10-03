/** 前后端共享的领域类型：DTO 与接口契约统一放在这里。 */

/** 对外暴露的用户对象（绝不含 passwordHash）。 */
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** 登录/注册成功后返回的载荷。 */
export interface AuthPayload {
  user: User;
  token: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
}

/** 统一 API 响应结构：成功 {success:true,data} / 失败 {success:false,error}。 */
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
