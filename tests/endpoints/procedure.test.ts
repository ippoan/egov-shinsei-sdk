import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('getProcedure', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  it('GET /procedure/{proc_id} returns procedure data', async () => {
    server.use(
      http.get(`${API_BASE}/procedure/:procId`, ({ params }) => {
        expect(params.procId).toBe('1234567890123456');
        return HttpResponse.json({
          metadata: { title: 'ok', detail: '', type: '', instance: '' },
          results: {
            file_data: 'base64data',
            configuration_file_name: ['config.xml'],
            file_info: [{ form_id: 'f1', form_name: 'Form 1' }],
          },
        });
      }),
    );
    const res = await client.getProcedure('1234567890123456');
    expect(res.results.file_data).toBe('base64data');
    expect(res.results.configuration_file_name).toEqual(['config.xml']);
  });

  it('throws 404 on not found', async () => {
    server.use(
      http.get(`${API_BASE}/procedure/:procId`, () => {
        return HttpResponse.json(
          { title: 'NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        );
      }),
    );
    await expect(client.getProcedure('unknown')).rejects.toThrow(EgovApiError);
  });
});
