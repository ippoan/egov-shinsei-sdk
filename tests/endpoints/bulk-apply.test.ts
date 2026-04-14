import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('bulkSubmitApplication', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  it('POST /bulk-apply submits bulk application', async () => {
    server.use(
      http.post(`${API_BASE}/bulk-apply`, () => {
        return HttpResponse.json({
          metadata: { title: 'ok', detail: '', type: '', instance: '' },
          results: {
            send_number: '123456789012345678',
            send_date: '2024-01-01 00:00:00',
            file_name: 'bulk.zip',
            apply_count: 5,
          },
          _links: { self: '', list: '', report: '' },
        });
      }),
    );
    const res = await client.bulkSubmitApplication({
      send_file: { file_name: 'bulk.zip', file_data: 'base64' },
    });
    expect(res.results.send_number).toBe('123456789012345678');
    expect(res.results.apply_count).toBe(5);
  });

  it('throws on error', async () => {
    server.use(
      http.post(`${API_BASE}/bulk-apply`, () => {
        return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
      }),
    );
    await expect(
      client.bulkSubmitApplication({ send_file: { file_name: 'f', file_data: '' } }),
    ).rejects.toThrow(EgovApiError);
  });
});
