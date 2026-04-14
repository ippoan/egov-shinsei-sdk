import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovClient } from '../src/client';
import { EgovApiError } from '../src/errors';
import { server } from './handlers/server';
import { API_BASE, AUTH_BASE, createTestClient, createAuthedClient } from './utils/client-factory';

describe('EgovClient', () => {
  describe('constructor', () => {
    it('creates client with config', () => {
      const client = createTestClient();
      expect(client).toBeInstanceOf(EgovClient);
    });

    it('uses globalThis.fetch when no custom fetch provided', async () => {
      const client = createAuthedClient();
      server.use(
        http.get(`${API_BASE}/procedure/test123`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { file_data: '', configuration_file_name: [], file_info: [] },
          });
        }),
      );
      const res = await client.getProcedure('test123');
      expect(res.metadata.title).toBe('ok');
    });
  });

  describe('setAccessToken', () => {
    it('sets token and uses it in requests', async () => {
      const client = createTestClient();
      client.setAccessToken('my-token');
      server.use(
        http.get(`${API_BASE}/procedure/p1`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBe('Bearer my-token');
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { file_data: '', configuration_file_name: [], file_info: [] },
          });
        }),
      );
      await client.getProcedure('p1');
    });
  });

  describe('custom fetch', () => {
    it('uses custom fetch function', async () => {
      const customFetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({
          metadata: { title: 'custom', detail: '', type: '', instance: '' },
          results: { file_data: '', configuration_file_name: [], file_info: [] },
        }), { status: 200 }),
      );
      const client = new EgovClient({
        apiBase: API_BASE,
        authBase: AUTH_BASE,
        clientId: 'test',
        fetch: customFetch,
      });
      client.setAccessToken('tok');
      await client.getProcedure('p1');
      expect(customFetch).toHaveBeenCalled();
    });
  });

  describe('request without token', () => {
    it('sends request without Authorization header when no token set', async () => {
      const client = createTestClient();
      server.use(
        http.get(`${API_BASE}/procedure/p1`, ({ request }) => {
          expect(request.headers.get('Authorization')).toBeNull();
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { file_data: '', configuration_file_name: [], file_info: [] },
          });
        }),
      );
      await client.getProcedure('p1');
    });
  });

  describe('request error handling', () => {
    it('throws EgovApiError on API error with title and detail', async () => {
      const client = createAuthedClient();
      server.use(
        http.get(`${API_BASE}/procedure/bad`, () => {
          return HttpResponse.json(
            { title: 'NOT_FOUND', detail: 'Procedure not found', type: '', instance: '' },
            { status: 404 },
          );
        }),
      );
      await expect(client.getProcedure('bad')).rejects.toThrow(EgovApiError);
      try {
        await client.getProcedure('bad');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.statusCode).toBe(404);
        expect(err.resultCode).toBe('NOT_FOUND');
        expect(err.errorMessages).toEqual(['Procedure not found']);
      }
    });

    it('throws EgovApiError with statusText when no detail in error body', async () => {
      const client = createAuthedClient();
      server.use(
        http.get(`${API_BASE}/procedure/bad2`, () => {
          return HttpResponse.json(
            { title: 'ERROR' },
            { status: 400 },
          );
        }),
      );
      try {
        await client.getProcedure('bad2');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.statusCode).toBe(400);
        expect(err.resultCode).toBe('ERROR');
        expect(err.errorMessages).toEqual(['Bad Request']);
      }
    });

    it('throws EgovApiError with UNKNOWN when error body has no title', async () => {
      const client = createAuthedClient();
      server.use(
        http.get(`${API_BASE}/procedure/bad3`, () => {
          return HttpResponse.json({}, { status: 500 });
        }),
      );
      try {
        await client.getProcedure('bad3');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.resultCode).toBe('UNKNOWN');
      }
    });

    it('handles non-JSON error body gracefully', async () => {
      const client = createAuthedClient();
      server.use(
        http.get(`${API_BASE}/procedure/bad4`, () => {
          return new HttpResponse('Not Found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
        }),
      );
      try {
        await client.getProcedure('bad4');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.statusCode).toBe(404);
        expect(err.resultCode).toBe('UNKNOWN');
      }
    });

    it('includes report_list when present in error', async () => {
      const client = createAuthedClient();
      server.use(
        http.post(`${API_BASE}/apply/check`, () => {
          return HttpResponse.json(
            { title: 'VALIDATION_ERROR', detail: 'Check failed', report_list: [{ content: 'err' }] },
            { status: 400 },
          );
        }),
      );
      try {
        await client.checkFormat({ proc_id: 'p', send_file: { file_name: 'f.zip', file_data: 'data' } });
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.reportList).toEqual([{ content: 'err' }]);
      }
    });
  });

  describe('204 No Content response', () => {
    it('returns undefined for 204 responses', async () => {
      const client = createAuthedClient();
      server.use(
        http.get(`${API_BASE}/procedure/empty`, () => {
          return new HttpResponse(null, { status: 204 });
        }),
      );
      const result = await client.getProcedure('empty');
      expect(result).toBeUndefined();
    });
  });

  describe('params handling', () => {
    it('appends query string when params provided', async () => {
      const client = createAuthedClient();
      server.use(
        http.get(`${API_BASE}/apply/lists`, ({ request }) => {
          const url = new URL(request.url);
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
      await client.listApplications({ limit: 10, offset: 0 });
    });
  });
});
