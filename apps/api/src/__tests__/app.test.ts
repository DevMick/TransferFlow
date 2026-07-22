import { describe, expect, it } from 'vitest';
import app from '../app.js';

describe('TransferFlow API', () => {
  it('GET /health returns ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);

    const body = (await res.json()) as { status: string; service: string };
    expect(body.status).toBe('ok');
    expect(body.service).toBe('transferflow-api');
  });

  it('rejects unauthenticated access to transfers', async () => {
    const res = await app.request('/api/transfers');
    expect(res.status).toBe(401);
  });
});
