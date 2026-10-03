import type { Request, Response } from 'express';
import type { ApiResponse } from '@monorepo/shared';

/** GET /api/health → 200 {status:'ok'}。 */
export function health(_req: Request, res: Response): void {
  const body: ApiResponse<{ status: string }> = { success: true, data: { status: 'ok' } };
  res.status(200).json(body);
}
