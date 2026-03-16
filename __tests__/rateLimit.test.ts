/**
 * Unit tests for lib/rateLimit.ts
 */

import { checkRateLimit, resetRateLimit } from '../lib/rateLimit';

function makeRequest(ip: string): Request {
  return new Request('http://localhost/api/admin/login', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip }
  });
}

describe('checkRateLimit', () => {
  const ip = '10.0.0.1';

  beforeEach(() => {
    resetRateLimit(makeRequest(ip));
  });

  test('allows first request', () => {
    const result = checkRateLimit(makeRequest(ip));
    expect(result.allowed).toBe(true);
  });

  test('tracks remaining attempts', () => {
    const result = checkRateLimit(makeRequest(ip));
    expect(result.remaining).toBe(4);
  });

  test('allows up to 5 attempts', () => {
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(makeRequest(ip));
      expect(result.allowed).toBe(true);
    }
  });

  test('blocks on 6th attempt', () => {
    for (let i = 0; i < 5; i++) checkRateLimit(makeRequest(ip));
    const result = checkRateLimit(makeRequest(ip));
    expect(result.allowed).toBe(false);
  });

  test('returns retryAfterMs when blocked', () => {
    for (let i = 0; i < 5; i++) checkRateLimit(makeRequest(ip));
    const result = checkRateLimit(makeRequest(ip));
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  test('different IPs have independent limits', () => {
    const ipA = '10.0.0.2';
    const ipB = '10.0.0.3';
    resetRateLimit(makeRequest(ipA));
    resetRateLimit(makeRequest(ipB));

    for (let i = 0; i < 5; i++) checkRateLimit(makeRequest(ipA));
    const blockedA = checkRateLimit(makeRequest(ipA));
    const allowedB = checkRateLimit(makeRequest(ipB));

    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);
  });

  test('resetRateLimit clears the bucket', () => {
    for (let i = 0; i < 5; i++) checkRateLimit(makeRequest(ip));
    resetRateLimit(makeRequest(ip));
    const result = checkRateLimit(makeRequest(ip));
    expect(result.allowed).toBe(true);
  });

  test('returns remaining 0 when blocked', () => {
    for (let i = 0; i < 5; i++) checkRateLimit(makeRequest(ip));
    const result = checkRateLimit(makeRequest(ip));
    expect(result.remaining).toBe(0);
  });
});
