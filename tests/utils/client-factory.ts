import { EgovClient } from '../../src/client';

export const API_BASE = 'https://api.test.e-gov.go.jp/shinsei/v2';
export const AUTH_BASE = 'https://account.test.e-gov.go.jp/auth';

export function createTestClient(opts?: { clientSecret?: string; fetch?: typeof globalThis.fetch }) {
  return new EgovClient({
    apiBase: API_BASE,
    authBase: AUTH_BASE,
    clientId: 'test-client-id',
    clientSecret: opts?.clientSecret ?? 'test-client-secret',
    fetch: opts?.fetch,
  });
}

export function createAuthedClient() {
  const client = createTestClient();
  client.setAccessToken('test-token');
  return client;
}
