import type { ApiResponse } from '@monorepo/shared';

/** 后端返回错误时的自定义异常，携带业务错误码。 */
export class ApiClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
  }
}

const API_BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/** unknown 收窄：判断是否为后端统一的 ApiResponse 结构。 */
function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  if (!('success' in value)) return false;
  if (value.success === true) return 'data' in value;
  return 'error' in value;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * 类型安全的 fetch 封装。
 * 成功时返回 ApiResponse<T> 中的 data；
 * 业务失败时抛出 ApiClientError；网络/解析异常时抛出带明确 code 的 ApiClientError。
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const mergedHeaders = new Headers({ 'Content-Type': 'application/json' });
  if (headers) {
    new Headers(headers).forEach((value, key) => {
      mergedHeaders.set(key, value);
    });
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers: mergedHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiClientError('NETWORK_ERROR', '网络连接失败，请确认后端服务是否正在运行');
  }

  let payload: unknown;
  try {
    payload = (await response.json()) as unknown;
  } catch {
    throw new ApiClientError('INVALID_RESPONSE', '服务器返回了无法解析的响应');
  }

  if (!isApiResponse(payload)) {
    throw new ApiClientError('INVALID_RESPONSE', '服务器返回了未知格式的响应');
  }

  if (!payload.success) {
    const code = typeof payload.error.code === 'string' ? payload.error.code : 'UNKNOWN_ERROR';
    const message =
      typeof payload.error.message === 'string' ? payload.error.message : '请求失败，请稍后重试';
    throw new ApiClientError(code, message);
  }

  return payload.data as T;
}
