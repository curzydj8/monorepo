import { ErrorCodes } from '@monorepo/shared';

/** 具名 HTTP 异常基类：statusCode 决定 HTTP 状态码，code 写入响应体。 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends HttpError {
  constructor(message = '请求参数校验失败', details?: unknown) {
    super(400, ErrorCodes.VALIDATION_ERROR, message, details);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = '未授权') {
    super(401, ErrorCodes.UNAUTHORIZED, message);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message = '资源不存在') {
    super(404, ErrorCodes.NOT_FOUND, message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends HttpError {
  constructor(message = '资源已存在') {
    super(409, ErrorCodes.CONFLICT, message);
    this.name = 'ConflictError';
  }
}
