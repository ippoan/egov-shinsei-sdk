import { describe, it, expect } from 'vitest';
import * as authSubpath from '../../src/auth';

describe('auth subpath export', () => {
  it('re-exports generatePKCE and buildAuthorizationUrl', () => {
    expect(typeof authSubpath.generatePKCE).toBe('function');
    expect(typeof authSubpath.buildAuthorizationUrl).toBe('function');
  });
});
