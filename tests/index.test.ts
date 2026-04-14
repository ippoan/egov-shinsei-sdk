import { describe, it, expect } from 'vitest';
import {
  EgovClient,
  EgovApiError,
  generatePKCE,
  buildAuthorizationUrl,
} from '../src/index';

describe('index re-exports', () => {
  it('exports EgovClient', () => {
    expect(EgovClient).toBeDefined();
  });

  it('exports EgovApiError', () => {
    expect(EgovApiError).toBeDefined();
  });

  it('exports generatePKCE', () => {
    expect(generatePKCE).toBeDefined();
    expect(typeof generatePKCE).toBe('function');
  });

  it('exports buildAuthorizationUrl', () => {
    expect(buildAuthorizationUrl).toBeDefined();
    expect(typeof buildAuthorizationUrl).toBe('function');
  });
});
