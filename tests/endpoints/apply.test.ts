import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('Apply endpoints', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  describe('submitApplication', () => {
    it('POST /apply submits application', async () => {
      server.use(
        http.post(`${API_BASE}/apply`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: {
              arrive_id: 'A001',
              arrive_date: '2024-01-01 00:00:00',
              corporation_name: 'Corp',
              applicant_name: 'User',
              apply_type: '新規申請',
              proc_name: 'Test Proc',
              ministry_name: 'Ministry',
              submission_destination: 'Dest',
              apply_form: { form: [], attached_file: [] },
            },
            _links: { self: '/apply', status: '/apply/A001' },
          });
        }),
      );
      const res = await client.submitApplication({
        proc_id: '1234567890123456',
        send_file: { file_name: 'data.zip', file_data: 'base64' },
      });
      expect(res.results.arrive_id).toBe('A001');
    });

    it('throws on 400 error', async () => {
      server.use(
        http.post(`${API_BASE}/apply`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid data' }, { status: 400 });
        }),
      );
      await expect(
        client.submitApplication({ proc_id: 'p', send_file: { file_name: 'f', file_data: '' } }),
      ).rejects.toThrow(EgovApiError);
    });
  });

  describe('listApplications', () => {
    it('GET /apply/lists with all params', async () => {
      server.use(
        http.get(`${API_BASE}/apply/lists`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('send_number')).toBe('SN001');
          expect(url.searchParams.get('date_from')).toBe('2024-01-01');
          expect(url.searchParams.get('date_to')).toBe('2024-12-31');
          expect(url.searchParams.get('limit')).toBe('20');
          expect(url.searchParams.get('offset')).toBe('0');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            result_set: { all_count: 1, limit: 20, offset: 0, count: 1 },
            results: [],
            _links: { self: '' },
          });
        }),
      );
      await client.listApplications({
        send_number: 'SN001',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        limit: 20,
        offset: 0,
      });
    });

    it('GET /apply/lists with no optional params', async () => {
      server.use(
        http.get(`${API_BASE}/apply/lists`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('send_number')).toBeNull();
          expect(url.searchParams.get('date_from')).toBeNull();
          expect(url.searchParams.get('date_to')).toBeNull();
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            result_set: { all_count: 0, limit: 10, offset: 0, count: 0 },
            results: [],
            _links: { self: '' },
          });
        }),
      );
      await client.listApplications({});
    });

    it('throws on 401', async () => {
      server.use(
        http.get(`${API_BASE}/apply/lists`, () => {
          return HttpResponse.json({ title: 'UNAUTHORIZED', detail: 'Invalid token' }, { status: 401 });
        }),
      );
      await expect(client.listApplications({})).rejects.toThrow(EgovApiError);
    });
  });

  describe('getApplication', () => {
    it('GET /apply/{arrive_id}', async () => {
      server.use(
        http.get(`${API_BASE}/apply/:arriveId`, ({ params }) => {
          expect(params.arriveId).toBe('A001');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { arrive_id: 'A001', status: 'accepted' },
          });
        }),
      );
      const res = await client.getApplication('A001');
      expect(res.results).toBeDefined();
    });

    it('throws on 404', async () => {
      server.use(
        http.get(`${API_BASE}/apply/:arriveId`, () => {
          return HttpResponse.json({ title: 'NOT_FOUND', detail: 'Not found' }, { status: 404 });
        }),
      );
      await expect(client.getApplication('unknown')).rejects.toThrow(EgovApiError);
    });
  });

  describe('getErrorReport', () => {
    it('GET /apply/report with params', async () => {
      server.use(
        http.get(`${API_BASE}/apply/report`, ({ request }) => {
          const url = new URL(request.url);
          expect(url.searchParams.get('send_number')).toBe('SN001');
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
      await client.getErrorReport({
        send_number: 'SN001',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        limit: 10,
        offset: 0,
      });
    });

    it('GET /apply/report with no optional params', async () => {
      server.use(
        http.get(`${API_BASE}/apply/report`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            result_set: { all_count: 0, limit: 10, offset: 0, count: 0 },
            results: [],
            _links: { self: '' },
          });
        }),
      );
      await client.getErrorReport({});
    });

    it('throws on error', async () => {
      server.use(
        http.get(`${API_BASE}/apply/report`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST' }, { status: 400 });
        }),
      );
      await expect(client.getErrorReport({})).rejects.toThrow(EgovApiError);
    });
  });
});
