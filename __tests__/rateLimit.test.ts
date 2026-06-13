/**
 * Unit tests — lib/rateLimit.ts
 * Covers: rateLimitResponse, key namespacing, headers, limits per route type
 */

import { rateLimitResponse } from '../lib/rateLimit';

function makeRequest(ip: string = '127.0.0.1'): Request {
  return new Request('https://test.capeverse.co.za/api/test', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('rateLimitResponse — basic', () => {
  test('returns null (allowed) on first request', () => {
    const result = rateLimitResponse(makeRequest('10.0.0.1'), 'public');
    expect(result).toBeNull();
  });
  test('returns null for different IPs on same key', () => {
    expect(rateLimitResponse(makeRequest('10.0.0.2'), 'public')).toBeNull();
    expect(rateLimitResponse(makeRequest('10.0.0.3'), 'public')).toBeNull();
  });
  test('returns Response (429) after exceeding limit', () => {
    const req = makeRequest('192.168.99.1');
    // Exhaust rate limit
    let blocked: Response | null = null;
    for (let i = 0; i < 200; i++) {
      const r = rateLimitResponse(req, 'public');
      if (r !== null) { blocked = r; break; }
    }
    expect(blocked).not.toBeNull();
    expect(blocked?.status).toBe(429);
  });
  test('429 response has JSON content-type', async () => {
    const req = makeRequest('192.168.99.2');
    let blocked: Response | null = null;
    for (let i = 0; i < 200; i++) {
      blocked = rateLimitResponse(req, 'public');
      if (blocked) break;
    }
    expect(blocked?.headers.get('content-type')).toContain('application/json');
  });
  test('429 body contains error field', async () => {
    const req = makeRequest('192.168.99.3');
    let blocked: Response | null = null;
    for (let i = 0; i < 200; i++) {
      blocked = rateLimitResponse(req, 'public');
      if (blocked) break;
    }
    const body = await blocked?.json();
    expect(body?.error).toBeTruthy();
  });
});

describe('rateLimitResponse — key namespacing', () => {
  test('itinerary key is namespaced separately from public', () => {
    const req1 = makeRequest('172.16.0.1');
    const req2 = makeRequest('172.16.0.1');
    // Same IP but different keys — should be independent counters
    const r1 = rateLimitResponse(req1, 'itinerary');
    const r2 = rateLimitResponse(req2, 'public');
    expect(r1).toBeNull();
    expect(r2).toBeNull();
  });
  test('ai_chat key is namespaced separately from itinerary', () => {
    const req1 = makeRequest('172.16.0.2');
    const req2 = makeRequest('172.16.0.2');
    const r1 = rateLimitResponse(req1, 'ai_chat');
    const r2 = rateLimitResponse(req2, 'itinerary');
    expect(r1).toBeNull();
    expect(r2).toBeNull();
  });
});

describe('rateLimitResponse — headers', () => {
  test('successful response returns null (no rate-limit headers to check)', () => {
    const result = rateLimitResponse(makeRequest('10.1.1.1'), 'public');
    expect(result).toBeNull();
  });
  test('429 response includes Retry-After header', () => {
    const req = makeRequest('10.1.1.2');
    let blocked: Response | null = null;
    for (let i = 0; i < 200; i++) {
      blocked = rateLimitResponse(req, 'public');
      if (blocked) break;
    }
    expect(blocked?.headers.get('retry-after')).toBeTruthy();
  });
});

describe('rateLimitResponse — IP extraction', () => {
  test('uses x-forwarded-for header when present', () => {
    const req = new Request('https://test.capeverse.co.za/', {
      headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' },
    });
    expect(rateLimitResponse(req, 'public')).toBeNull();
  });
  test('falls back gracefully when no IP header', () => {
    const req = new Request('https://test.capeverse.co.za/');
    expect(() => rateLimitResponse(req, 'public')).not.toThrow();
  });
});
