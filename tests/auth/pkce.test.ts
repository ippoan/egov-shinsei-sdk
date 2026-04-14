import { describe, it, expect } from 'vitest';
import { generatePKCE } from '../../src/auth/pkce';

describe('generatePKCE', () => {
  it('returns codeVerifier and codeChallenge', async () => {
    const result = await generatePKCE();
    expect(result).toHaveProperty('codeVerifier');
    expect(result).toHaveProperty('codeChallenge');
  });

  it('codeVerifier is 64 characters', async () => {
    const { codeVerifier } = await generatePKCE();
    expect(codeVerifier).toHaveLength(64);
  });

  it('codeChallenge is base64url encoded (no +, /, or = chars)', async () => {
    const { codeChallenge } = await generatePKCE();
    expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    // SHA-256 produces 32 bytes -> base64url without padding is 43 chars
    expect(codeChallenge).toHaveLength(43);
  });

  it('multiple calls produce different values', async () => {
    const a = await generatePKCE();
    const b = await generatePKCE();
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
    expect(a.codeChallenge).not.toBe(b.codeChallenge);
  });
});
