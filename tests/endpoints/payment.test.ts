import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('Payment endpoints', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  describe('listPaymentBanks', () => {
    it('GET /payment/lists returns bank list', async () => {
      server.use(
        http.get(`${API_BASE}/payment/lists`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { bank_list: [{ bank_code: '0001', bank_name: 'Bank A' }] },
          });
        }),
      );
      const res = await client.listPaymentBanks();
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.get(`${API_BASE}/payment/lists`, () => {
          return HttpResponse.json({ title: 'UNAUTHORIZED' }, { status: 401 });
        }),
      );
      await expect(client.listPaymentBanks()).rejects.toThrow(EgovApiError);
    });
  });

  describe('getPaymentInfo', () => {
    it('GET /payment/{arrive_id}', async () => {
      server.use(
        http.get(`${API_BASE}/payment/:arriveId`, ({ params }) => {
          expect(params.arriveId).toBe('A001');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { arrive_id: 'A001' },
          });
        }),
      );
      const res = await client.getPaymentInfo('A001');
      expect(res.results).toBeDefined();
    });

    it('throws on 404', async () => {
      server.use(
        http.get(`${API_BASE}/payment/:arriveId`, () => {
          return HttpResponse.json({ title: 'NOT_FOUND', detail: 'Not found' }, { status: 404 });
        }),
      );
      await expect(client.getPaymentInfo('unknown')).rejects.toThrow(EgovApiError);
    });
  });

  describe('displayPaymentSite', () => {
    it('POST /payment returns payment site URL', async () => {
      server.use(
        http.post(`${API_BASE}/payment`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { url: 'https://bank.example.com/pay' },
          });
        }),
      );
      const res = await client.displayPaymentSite({
        arrive_id: 'A001',
        bank_code: '0001',
      } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.post(`${API_BASE}/payment`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.displayPaymentSite({} as any)).rejects.toThrow(EgovApiError);
    });
  });
});
