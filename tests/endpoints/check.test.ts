import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('checkFormat', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  it('POST /apply/check executes format check', async () => {
    server.use(
      http.post(`${API_BASE}/apply/check`, () => {
        return HttpResponse.json({
          metadata: { title: 'ok', detail: '', type: '', instance: '' },
          results: { message: 'OK', error_count: 0 },
        });
      }),
    );
    const res = await client.checkFormat({
      proc_id: '1234567890123456',
      send_file: { file_name: 'check.zip', file_data: 'base64' },
    });
    expect(res.results.message).toBe('OK');
    expect(res.results.error_count).toBe(0);
  });

  it('throws on error', async () => {
    server.use(
      http.post(`${API_BASE}/apply/check`, () => {
        return HttpResponse.json({ title: 'VALIDATION_ERROR', detail: 'Check failed' }, { status: 400 });
      }),
    );
    await expect(
      client.checkFormat({ proc_id: 'p', send_file: { file_name: 'f', file_data: '' } }),
    ).rejects.toThrow(EgovApiError);
  });
});
