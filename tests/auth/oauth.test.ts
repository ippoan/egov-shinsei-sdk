import { describe, it, expect } from 'vitest';
import { buildAuthorizationUrl } from '../../src/auth/oauth';

describe('buildAuthorizationUrl', () => {
  const baseParams = {
    authBase: 'https://account.test.e-gov.go.jp/auth',
    clientId: 'test-client-id',
    redirectUri: 'https://example.com/callback',
    state: 'random-state-123',
    codeChallenge: 'test-code-challenge',
  };

  it('builds correct URL with all params', () => {
    const url = buildAuthorizationUrl(baseParams);
    const parsed = new URL(url);
    expect(parsed.origin).toBe('https://account.test.e-gov.go.jp');
    expect(parsed.pathname).toBe('/auth/auth');
    expect(parsed.searchParams.get('response_type')).toBe('code');
    expect(parsed.searchParams.get('client_id')).toBe('test-client-id');
    expect(parsed.searchParams.get('redirect_uri')).toBe('https://example.com/callback');
    expect(parsed.searchParams.get('state')).toBe('random-state-123');
    expect(parsed.searchParams.get('code_challenge')).toBe('test-code-challenge');
    expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
  });

  it('default scope is openid offline_access', () => {
    const url = buildAuthorizationUrl(baseParams);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('scope')).toBe('openid offline_access');
  });

  it('custom scope overrides default', () => {
    const url = buildAuthorizationUrl({ ...baseParams, scope: 'openid' });
    const parsed = new URL(url);
    expect(parsed.searchParams.get('scope')).toBe('openid');
  });
});
