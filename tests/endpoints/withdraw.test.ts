import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('withdrawApplication', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  it('POST /apply/withdraw submits withdrawal', async () => {
    server.use(
      http.post(`${API_BASE}/apply/withdraw`, () => {
        return HttpResponse.json({
          metadata: { title: 'ok', detail: '', type: '', instance: '' },
          results: {
            arrive_id: 'A001',
            withdraw_date: '2024-01-01 00:00:00',
            applicant_name: 'User',
            proc_name: 'Proc',
            ministry_name: 'Ministry',
          },
        });
      }),
    );
    const res = await client.withdrawApplication({
      arrive_id: 'A001',
      send_file: { file_name: 'wd.zip', file_data: 'base64' },
    });
    expect(res.results.arrive_id).toBe('A001');
  });

  it('throws on error', async () => {
    server.use(
      http.post(`${API_BASE}/apply/withdraw`, () => {
        return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
      }),
    );
    await expect(
      client.withdrawApplication({ arrive_id: 'A', send_file: { file_name: 'f', file_data: '' } }),
    ).rejects.toThrow(EgovApiError);
  });
});
