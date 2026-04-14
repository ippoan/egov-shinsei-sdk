import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { API_BASE, createAuthedClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('Share Setting endpoints', () => {
  let client: EgovClient;
  beforeEach(() => { client = createAuthedClient(); });

  describe('listShareSettings', () => {
    it('GET /share-setting/lists', async () => {
      server.use(
        http.get(`${API_BASE}/share-setting/lists`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { share_settings: [] },
          });
        }),
      );
      const res = await client.listShareSettings();
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.get(`${API_BASE}/share-setting/lists`, () => {
          return HttpResponse.json({ title: 'UNAUTHORIZED' }, { status: 401 });
        }),
      );
      await expect(client.listShareSettings()).rejects.toThrow(EgovApiError);
    });
  });

  describe('createShareSetting', () => {
    it('POST /share-setting creates share setting', async () => {
      server.use(
        http.post(`${API_BASE}/share-setting`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { share_id: 'S001' },
          });
        }),
      );
      const res = await client.createShareSetting({ target_account_id: 'acc1' } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.post(`${API_BASE}/share-setting`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.createShareSetting({} as any)).rejects.toThrow(EgovApiError);
    });
  });

  describe('updateShareSetting', () => {
    it('PUT /share-setting updates share setting', async () => {
      server.use(
        http.put(`${API_BASE}/share-setting`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { share_id: 'S001' },
          });
        }),
      );
      const res = await client.updateShareSetting({ share_id: 'S001' } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.put(`${API_BASE}/share-setting`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.updateShareSetting({} as any)).rejects.toThrow(EgovApiError);
    });
  });

  describe('deleteShareSetting', () => {
    it('DELETE /share-setting deletes share setting', async () => {
      server.use(
        http.delete(`${API_BASE}/share-setting`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { share_id: 'S001' },
          });
        }),
      );
      const res = await client.deleteShareSetting({ share_id: 'S001' } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.delete(`${API_BASE}/share-setting`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.deleteShareSetting({} as any)).rejects.toThrow(EgovApiError);
    });
  });

  describe('confirmShareSetting', () => {
    it('POST /share-confirmation confirms share setting', async () => {
      server.use(
        http.post(`${API_BASE}/share-confirmation`, () => {
          return HttpResponse.json({
            metadata: { title: 'ok', detail: '', type: '', instance: '' },
            results: { share_id: 'S001' },
          });
        }),
      );
      const res = await client.confirmShareSetting({ share_id: 'S001', confirm: true } as any);
      expect(res.results).toBeDefined();
    });

    it('throws on error', async () => {
      server.use(
        http.post(`${API_BASE}/share-confirmation`, () => {
          return HttpResponse.json({ title: 'BAD_REQUEST', detail: 'Invalid' }, { status: 400 });
        }),
      );
      await expect(client.confirmShareSetting({} as any)).rejects.toThrow(EgovApiError);
    });
  });
});
