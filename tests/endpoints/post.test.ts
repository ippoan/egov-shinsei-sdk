import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('Post (Electronic Delivery) endpoints', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  describe('applyPostDelivery', () => {
    it('POST /post-apply submits post delivery application', async () => {
      server.use(
        http.post(`${API_BASE}/post-apply`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { arrive_id: 'P001' },
          });
        }),
      );
      const res = await client.applyPostDelivery({ proc_id: 'p1' } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.post(`${API_BASE}/post-apply`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.applyPostDelivery({} as any)).rejects.toThrow(EgovApiError);
    });
  });

  describe('getPostApplyStatus', () => {
    it('GET /post-apply/{arrive_id}', async () => {
      server.use(
        http.get(`${API_BASE}/post-apply/:arriveId`, ({ params }) => {
          expect(params.arriveId).toBe('P001');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { arrive_id: 'P001', status: 'accepted' },
          });
        }),
      );
      const res = await client.getPostApplyStatus('P001');
      expect(res.results).toBeDefined();
    });

    it('throws on 404', async () => {
      server.use(
        http.get(`${API_BASE}/post-apply/:arriveId`, () => {
          return HttpResponse.json({ title: 'NOT_FOUND', detail: 'Not found' }, { status: 404 });
        }),
      );
      await expect(client.getPostApplyStatus('unknown')).rejects.toThrow(EgovApiError);
    });
  });

  describe('listPostDeliveries', () => {
    it('GET /post/lists with params', async () => {
      server.use(
        http.get(`${API_BASE}/post/lists`, ({ request }) => {
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
      await client.listPostDeliveries({
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        limit: 10,
        offset: 0,
      });
    });

    it('throws on error', async () => {
      server.use(
        http.get(`${API_BASE}/post/lists`, () => {
          return HttpResponse.json({ title: 'UNAUTHORIZED' }, { status: 401 });
        }),
      );
      await expect(
        client.listPostDeliveries({ date_from: '', date_to: '', limit: 10, offset: 0 }),
      ).rejects.toThrow(EgovApiError);
    });
  });

  describe('getPostDelivery', () => {
    it('GET /post/{post_id}', async () => {
      server.use(
        http.get(`${API_BASE}/post/:postId`, ({ params }) => {
          expect(params.postId).toBe('POST001');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { post_id: 'POST001' },
          });
        }),
      );
      const res = await client.getPostDelivery('POST001');
      expect(res.results).toBeDefined();
    });

    it('throws on 404', async () => {
      server.use(
        http.get(`${API_BASE}/post/:postId`, () => {
          return HttpResponse.json({ title: 'NOT_FOUND', detail: 'Not found' }, { status: 404 });
        }),
      );
      await expect(client.getPostDelivery('unknown')).rejects.toThrow(EgovApiError);
    });
  });

  describe('completePostDelivery', () => {
    it('POST /post completes post delivery', async () => {
      server.use(
        http.post(`${API_BASE}/post`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { post_id: 'POST001' },
          });
        }),
      );
      const res = await client.completePostDelivery({ post_id: 'POST001' } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.post(`${API_BASE}/post`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.completePostDelivery({} as any)).rejects.toThrow(EgovApiError);
    });
  });
});
