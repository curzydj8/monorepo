import type { NextFunction, Request, Response } from 'express';
import { ErrorCodes, type ApiResponse } from '@monorepo/shared';
import { HttpError } from '../errors.js';
import { config } from '../config.js';

/** 从第三方库抛出的错误对象上提取 HTTP 状态码（如 body-parser 的 400）。 */
function extractHttpStatus(err: object): number | undefined {
  if ('statusCode' in err && typeof err.statusCode === 'number') {
    return err.statusCode;
  }
  if ('status' in err && typeof err.status === 'number') {
    return err.status;
  }
  return undefined;
}

/**
 * 全局统一错误中间件（必须挂在所有路由之后）。
 * 输出统一结构 {success:false, error:{code,message,details?}}，
 * 生产环境不泄露未知异常的堆栈与原始信息。
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let code: string = ErrorCodes.INTERNAL_ERROR;
  let message = '服务器内部错误';
  let details: unknown;

  if (err instanceof HttpError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof Error) {
    const httpStatus = extractHttpStatus(err);
    if (httpStatus !== undefined && httpStatus >= 400 && httpStatus < 500) {
      // body-parser 等中间件抛出的 4xx（如 JSON 解析失败）直接透出。
      statusCode = httpStatus;
      code = ErrorCodes.VALIDATION_ERROR;
      message = config.NODE_ENV === 'production' ? '请求无效' : err.message;
    } else {
      message = config.NODE_ENV === 'production' ? '服务器内部错误' : err.message;
    }
  }

  const body: ApiResponse<never> =
    details === undefined
      ? { success: false, error: { code, message } }
      : { success: false, error: { code, message, details } };

  res.status(statusCode).json(body);
}
