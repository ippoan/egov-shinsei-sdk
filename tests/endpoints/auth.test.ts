import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { EgovApiError } from '../../src/errors';
import { server } from '../handlers/server';
import { AUTH_BASE, createTestClient } from '../utils/client-factory';
import type { EgovClient } from '../../src/client';

describe('Auth endpoints', () => {
  let client: EgovClient;
  beforeEach(() => { client = createTestClient({ clientSecret: 'test-secret' }); });

  const tokenResponse = {
    access_token: 'access-tok',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'refresh-tok',
    scope: 'openid offline_access',
  };

  describe('exchangeCode', () => {
    it('POST /token with authorization_code grant and Basic auth', async () => {
      server.use(
        http.post(`${AUTH_BASE}/token`, async ({ request }) => {
          const auth = request.headers.get('Authorization');
          expect(auth).toBe(`Basic ${btoa('test-client-id:test-secret')}`);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('grant_type')).toBe('authorization_code');
          expect(params.get('code')).toBe('auth-code');
          expect(params.get('redirect_uri')).toBe('https://example.com/cb');
          return HttpResponse.json(tokenResponse);
        }),
      );
      const res = await client.exchangeCode('auth-code', 'https://example.com/cb');
      expect(res.access_token).toBe('access-tok');
    });

    it('includes code_verifier when provided', async () => {
      server.use(
        http.post(`${AUTH_BASE}/token`, async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('code_verifier')).toBe('verifier-123');
          return HttpResponse.json(tokenResponse);
        }),
      );
      await client.exchangeCode('auth-code', 'https://example.com/cb', 'verifier-123');
    });

    it('throws EgovApiError on error', async () => {
      server.use(
        http.post(`${AUTH_BASE}/token`, () => {
          return HttpResponse.json(
            { error: 'invalid_grant', error_description: 'Code expired' },
            { status: 400 },
          );
        }),
      );
      await expect(client.exchangeCode('bad-code', 'https://example.com/cb')).rejects.toThrow(EgovApiError);
      try {
        await client.exchangeCode('bad-code', 'https://example.com/cb');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.statusCode).toBe(400);
        expect(err.resultCode).toBe('invalid_grant');
        expect(err.errorMessages).toEqual(['Code expired']);
      }
    });

    it('handles token error with title/detail instead of error/error_description', async () => {
      server.use(
        http.post(`${AUTH_BASE}/token`, () => {
          return HttpResponse.json(
            { title: 'SERVER_ERROR', detail: 'Something went wrong' },
            { status: 500 },
          );
        }),
      );
      try {
        await client.exchangeCode('code', 'uri');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.resultCode).toBe('SERVER_ERROR');
        expect(err.errorMessages).toEqual(['Something went wrong']);
      }
    });

    it('handles non-JSON error body in token request', async () => {
      server.use(
        http.post(`${AUTH_BASE}/token`, () => {
          return new HttpResponse('Internal Server Error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
        }),
      );
      try {
        await client.exchangeCode('code', 'uri');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.statusCode).toBe(500);
        expect(err.resultCode).toBe('UNKNOWN');
      }
    });
  });

  describe('refreshToken', () => {
    it('POST /token with refresh_token grant', async () => {
      server.use(
        http.post(`${AUTH_BASE}/token`, async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('grant_type')).toBe('refresh_token');
          expect(params.get('refresh_token')).toBe('my-refresh');
          return HttpResponse.json(tokenResponse);
        }),
      );
      const res = await client.refreshToken('my-refresh');
      expect(res.access_token).toBe('access-tok');
    });

    it('throws on error', async () => {
      server.use(
        http.post(`${AUTH_BASE}/token`, () => {
          return HttpResponse.json({ error: 'invalid_grant' }, { status: 400 });
        }),
      );
      await expect(client.refreshToken('bad')).rejects.toThrow(EgovApiError);
    });
  });

  describe('introspectToken', () => {
    it('POST /token with token and token_type_hint', async () => {
      server.use(
        http.post(`${AUTH_BASE}/token`, async ({ request }) => {
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('token')).toBe('tok-to-check');
          expect(params.get('token_type_hint')).toBe('access_token');
          return HttpResponse.json({ active: true, scope: 'openid' });
        }),
      );
      const res = await client.introspectToken('tok-to-check');
      expect(res.active).toBe(true);
    });
  });

  describe('logout', () => {
    it('POST /logout with refresh_token', async () => {
      server.use(
        http.post(`${AUTH_BASE}/logout`, async ({ request }) => {
          const auth = request.headers.get('Authorization');
          expect(auth).toBe(`Basic ${btoa('test-client-id:test-secret')}`);
          const body = await request.text();
          const params = new URLSearchParams(body);
          expect(params.get('refresh_token')).toBe('tok-to-revoke');
          return new HttpResponse(null, { status: 204 });
        }),
      );
      await client.logout('tok-to-revoke');
    });

    it('throws EgovApiError on logout error', async () => {
      server.use(
        http.post(`${AUTH_BASE}/logout`, () => {
          return HttpResponse.json(
            { error: 'invalid_token', error_description: 'Token revoked' },
            { status: 401 },
          );
        }),
      );
      await expect(client.logout('bad-tok')).rejects.toThrow(EgovApiError);
    });

    it('handles logout error with title/detail', async () => {
      server.use(
        http.post(`${AUTH_BASE}/logout`, () => {
          return HttpResponse.json(
            { title: 'ERROR', detail: 'Logout failed' },
            { status: 500 },
          );
        }),
      );
      try {
        await client.logout('tok');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.resultCode).toBe('ERROR');
        expect(err.errorMessages).toEqual(['Logout failed']);
      }
    });

    it('handles non-JSON logout error', async () => {
      server.use(
        http.post(`${AUTH_BASE}/logout`, () => {
          return new HttpResponse('Error', { status: 500, headers: { 'Content-Type': 'text/plain' } });
        }),
      );
      try {
        await client.logout('tok');
      } catch (e) {
        const err = e as EgovApiError;
        expect(err.statusCode).toBe(500);
        expect(err.resultCode).toBe('UNKNOWN');
      }
    });
  });

  describe('clientSecret fallback', () => {
    it('uses empty string when clientSecret is not provided', async () => {
      const noSecretClient = createTestClient({ clientSecret: undefined });
      // Need a client without secret - recreate
      const { EgovClient } = await import('../../src/client');
      const c = new EgovClient({
        apiBase: 'https://api.test.e-gov.go.jp/shinsei/v2',
        authBase: AUTH_BASE,
        clientId: 'test-client-id',
      });
      server.use(
        http.post(`${AUTH_BASE}/token`, async ({ request }) => {
          const auth = request.headers.get('Authorization');
          expect(auth).toBe(`Basic ${btoa('test-client-id:')}`);
          return HttpResponse.json(tokenResponse);
        }),
      );
      await c.exchangeCode('code', 'uri');
    });

    it('logout uses empty string when clientSecret is not provided', async () => {
      const { EgovClient } = await import('../../src/client');
      const c = new EgovClient({
        apiBase: 'https://api.test.e-gov.go.jp/shinsei/v2',
        authBase: AUTH_BASE,
        clientId: 'test-client-id',
      });
      server.use(
        http.post(`${AUTH_BASE}/logout`, async ({ request }) => {
          const auth = request.headers.get('Authorization');
          expect(auth).toBe(`Basic ${btoa('test-client-id:')}`);
          return new HttpResponse(null, { status: 204 });
        }),
      );
      await c.logout('tok');
    });
  });
});
