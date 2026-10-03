import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { ApiClientError, apiFetch } from '../src/api/client';
import { server } from './mocks/server';

const API_BASE = 'http://localhost:4000';

describe('apiFetch', () => {
  it('成功时返回 data 载荷', async () => {
    server.use(
      http.get(`${API_BASE}/api/ping`, () =>
        HttpResponse.json({ success: true, data: { pong: true } }),
      ),
    );
    const data = await apiFetch<{ pong: boolean }>('/api/ping');
    expect(data).toEqual({ pong: true });
  });

  it('POST 时把 body 序列化为 JSON', async () => {
    server.use(
      http.post(`${API_BASE}/api/echo`, async ({ request }) => {
        const body: unknown = await request.json();
        const contentType = request.headers.get('Content-Type');
        return HttpResponse.json({ success: true, data: { body, contentType } });
      }),
    );
    const data = await apiFetch<{ body: unknown; contentType: string | null }>('/api/echo', {
      method: 'POST',
      body: { a: 1 },
    });
    expect(data.body).toEqual({ a: 1 });
    expect(data.contentType).toContain('application/json');
  });

  it('{success:false} 时抛出 ApiClientError 且 code/message 正确', async () => {
    server.use(
      http.get(`${API_BASE}/api/fail`, () =>
        HttpResponse.json(
          { success: false, error: { code: 'SOME_CODE', message: '出错了' } },
          { status: 400 },
        ),
      ),
    );
    try {
      await apiFetch('/api/fail');
      expect.unreachable('应当抛出 ApiClientError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiClientError);
      const clientError = err as ApiClientError;
      expect(clientError.name).toBe('ApiClientError');
      expect(clientError.code).toBe('SOME_CODE');
      expect(clientError.message).toBe('出错了');
    }
  });

  it('非 JSON 响应时抛出 INVALID_RESPONSE', async () => {
    server.use(http.get(`${API_BASE}/api/text`, () => HttpResponse.text('plain text')));
    await expect(apiFetch('/api/text')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('JSON 但非 ApiResponse 结构时抛出 INVALID_RESPONSE', async () => {
    server.use(http.get(`${API_BASE}/api/weird`, () => HttpResponse.json({ foo: 'bar' })));
    await expect(apiFetch('/api/weird')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('success 为 true 但缺少 data 时抛出 INVALID_RESPONSE', async () => {
    server.use(http.get(`${API_BASE}/api/nodata`, () => HttpResponse.json({ success: true })));
    await expect(apiFetch('/api/nodata')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('网络错误时抛出 NETWORK_ERROR', async () => {
    server.use(http.get(`${API_BASE}/api/down`, () => HttpResponse.error()));
    await expect(apiFetch('/api/down')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
  });
});
