import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('getPreprint', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  it('POST /preprint returns preprint data', async () => {
    server.use(
      http.post(`${API_BASE}/preprint`, async ({ request }) => {
        const body = await request.json() as any;
        expect(body.proc_id).toBe('1234567890123456');
        return HttpResponse.json({
          metadata: { title: 'ok', detail: '', type: '', instance: '' },
          results: {
            apply_file: { file_name: 'form.xml', file_data: 'base64' },
          },
        });
      }),
    );
    const res = await client.getPreprint({
      application_info: [{ label: 'name', value: 'test' }],
      proc_id: '1234567890123456',
      form_id: '123456789012345678',
      form_version: 1,
      file_data: 'base64data',
    });
    expect(res.results.apply_file.file_name).toBe('form.xml');
  });

  it('throws on error', async () => {
    server.use(
      http.post(`${API_BASE}/preprint`, () => {
        return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
      }),
    );
    await expect(
      client.getPreprint({
        application_info: [],
        proc_id: 'p',
        form_id: 'f',
        form_version: 1,
        file_data: '',
      }),
    ).rejects.toThrow(EgovApiError);
  });
});
