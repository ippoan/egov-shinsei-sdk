import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('Official Document endpoints', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  describe('getOfficialDocument', () => {
    it('GET /official_document/{arrive_id}/{notice_sub_id}', async () => {
      server.use(
        http.get(`${API_BASE}/official_document/:arriveId/:noticeSubId`, ({ params }) => {
          expect(params.arriveId).toBe('A001');
          expect(params.noticeSubId).toBe('1');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { file_data: 'base64data', file_name_list: [{ file_name: 'doc.pdf' }] },
            _links: { self: '', complete: '' },
          });
        }),
      );
      const res = await client.getOfficialDocument('A001', '1');
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.get(`${API_BASE}/official_document/:arriveId/:noticeSubId`, () => {
          return HttpResponse.json({ title: 'NOT_FOUND', detail: 'Not found' }, { status: 404 });
        }),
      );
      await expect(client.getOfficialDocument('unknown', '1')).rejects.toThrow(EgovApiError);
    });
  });

  describe('completeOfficialDocument', () => {
    it('POST /official_document completes document receipt', async () => {
      server.use(
        http.post(`${API_BASE}/official_document`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { arrive_id: 'A001', notice_sub_id: 1 },
          });
        }),
      );
      const res = await client.completeOfficialDocument({
        arrive_id: 'A001',
        notice_sub_id: 1,
        file_name_list: [{ file_name: 'doc.pdf' }],
      } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.post(`${API_BASE}/official_document`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.completeOfficialDocument({} as any)).rejects.toThrow(EgovApiError);
    });
  });

  describe('verifyOfficialDocument', () => {
    it('POST /official_document/verify verifies document signature', async () => {
      server.use(
        http.post(`${API_BASE}/official_document/verify`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { verify_result: 'valid' },
          });
        }),
      );
      const res = await client.verifyOfficialDocument({
        arrive_id: 'A001',
        notice_sub_id: 1,
      } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.post(`${API_BASE}/official_document/verify`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.verifyOfficialDocument({} as any)).rejects.toThrow(EgovApiError);
    });
  });
});
