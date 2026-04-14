import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('Notice endpoints', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  describe('listNotices', () => {
    it('GET /notice/lists with params', async () => {
      server.use(
        http.get(`${API_BASE}/notice/lists`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('date_from')).toBe('2024-01-01');
          expect(url.searchParams.get('date_to')).toBe('2024-12-31');
          expect(url.searchParams.get('limit')).toBe('10');
          expect(url.searchParams.get('offset')).toBe('0');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            result_set: { all_count: 0, limit: 10, offset: 0, count: 0 },
            results: [],
            _links: { self: '' },
          });
        }),
      );
      await client.listNotices({
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        limit: 10,
        offset: 0,
      });
    });

    it('throws on error', async () => {
      server.use(
        http.get(`${API_BASE}/notice/lists`, () => {
          return HttpResponse.json({ title: 'UNAUTHORIZED' }, { status: 401 });
        }),
      );
      await expect(
        client.listNotices({ date_from: '', date_to: '', limit: 10, offset: 0 }),
      ).rejects.toThrow(EgovApiError);
    });
  });

  describe('getNotice', () => {
    it('GET /notice/{arrive_id}/{notice_sub_id}', async () => {
      server.use(
        http.get(`${API_BASE}/notice/:arriveId/:noticeSubId`, ({ params }) => {
          expect(params.arriveId).toBe('A001');
          expect(params.noticeSubId).toBe('1');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { arrive_id: 'A001', notice_sub_id: 1 },
          });
        }),
      );
      const res = await client.getNotice('A001', '1');
      expect(res.results).toBeDefined();
    });

    it('throws on 404', async () => {
      server.use(
        http.get(`${API_BASE}/notice/:arriveId/:noticeSubId`, () => {
          return HttpResponse.json({ title: 'NOT_FOUND', detail: 'Not found' }, { status: 404 });
        }),
      );
      await expect(client.getNotice('unknown', '1')).rejects.toThrow(EgovApiError);
    });
  });
});
