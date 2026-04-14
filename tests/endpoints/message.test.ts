import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('Message endpoints', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  describe('listMessages', () => {
    it('GET /message/lists with params', async () => {
      server.use(
        http.get(`${API_BASE}/message/lists`, ({ request }) => {
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
      await client.listMessages({
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        limit: 10,
        offset: 0,
      });
    });

    it('throws on error', async () => {
      server.use(
        http.get(`${API_BASE}/message/lists`, () => {
          return HttpResponse.json({ title: 'UNAUTHORIZED' }, { status: 401 });
        }),
      );
      await expect(
        client.listMessages({ date_from: '', date_to: '', limit: 10, offset: 0 }),
      ).rejects.toThrow(EgovApiError);
    });
  });

  describe('getMessage', () => {
    it('GET /message/{information_id}', async () => {
      server.use(
        http.get(`${API_BASE}/message/:informationId`, ({ params }) => {
          expect(params.informationId).toBe('MSG001');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { information_id: 'MSG001' },
          });
        }),
      );
      const res = await client.getMessage('MSG001');
      expect(res.results).toBeDefined();
    });

    it('throws on 404', async () => {
      server.use(
        http.get(`${API_BASE}/message/:informationId`, () => {
          return HttpResponse.json({ title: 'NOT_FOUND', detail: 'Not found' }, { status: 404 });
        }),
      );
      await expect(client.getMessage('unknown')).rejects.toThrow(EgovApiError);
    });
  });
});
