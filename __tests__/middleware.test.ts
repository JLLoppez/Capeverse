/**
 * Unit tests — middleware.ts
 * Covers: admin UI guard, admin API guard, cron guard,
 *         login page bypass, setup page bypass, valid token pass-through
 */

process.env.CRON_SECRET = 'cron-secret-for-tests';

import { middleware } from '../middleware';
import { NextRequest } from 'next/server';

// Mock auth
jest.mock('../lib/auth', () => ({
  verifyAdminToken: jest.fn(),
}));
import { verifyAdminToken } from '../lib/auth';
const mockVerify = verifyAdminToken as jest.Mock;

function makeReq(pathname: string, cookie?: string, authHeader?: string) {
  const url = `https://capeverse.co.za${pathname}`;
  const headers: Record<string, string> = {};
  if (cookie)     headers['cookie']        = cookie;
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest(url, { headers });
}

beforeEach(() => jest.clearAllMocks());

// ─── Admin UI routes ──────────────────────────────────────────────────────────

describe('middleware — admin UI (/admin/*)', () => {
  test('redirects to /admin/login when no token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/admin/enquiries'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/login');
  });
  test('redirect URL contains from= param', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/admin/enquiries'));
    expect(res.headers.get('location')).toContain('from=');
  });
  test('passes through when token valid', () => {
    mockVerify.mockReturnValue(true);
    const res = middleware(makeReq('/admin/enquiries', 'cape_admin_session=valid.token'));
    expect(res.status).toBe(200);
  });
  test('allows /admin/login without token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/admin/login'));
    expect(res.status).toBe(200);
  });
  test('allows /admin/setup without token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/admin/setup'));
    expect(res.status).toBe(200);
  });
  test('allows /admin/login/callback without token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/admin/login/callback'));
    expect(res.status).toBe(200);
  });
  test('blocks /admin/tours without token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/admin/tours'));
    expect(res.status).toBe(307);
  });
  test('blocks /admin/reviews without token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/admin/reviews'));
    expect(res.status).toBe(307);
  });
  test('blocks /admin/availability without token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/admin/availability'));
    expect(res.status).toBe(307);
  });
});

// ─── Admin API routes ─────────────────────────────────────────────────────────

describe('middleware — admin API (/api/admin/*)', () => {
  test('returns 401 JSON when no token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/api/admin/analytics'));
    expect(res.status).toBe(401);
  });
  test('401 body is JSON', async () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/api/admin/analytics'));
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
  test('passes through with valid token', () => {
    mockVerify.mockReturnValue(true);
    const res = middleware(makeReq('/api/admin/analytics', 'cape_admin_session=valid.token'));
    expect(res.status).toBe(200);
  });
  test('blocks /api/admin/tours without token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/api/admin/tours'));
    expect(res.status).toBe(401);
  });
  test('blocks /api/admin/reviews/[id]/approve without token', () => {
    mockVerify.mockReturnValue(false);
    const res = middleware(makeReq('/api/admin/reviews/rev_1/approve'));
    expect(res.status).toBe(401);
  });
});

// ─── Cron routes ──────────────────────────────────────────────────────────────

describe('middleware — cron (/api/cron/*)', () => {
  test('returns 401 with wrong bearer token', () => {
    const res = middleware(makeReq('/api/cron/reviews', undefined, 'Bearer wrong-secret'));
    expect(res.status).toBe(401);
  });
  test('returns 401 with no authorization header', () => {
    const res = middleware(makeReq('/api/cron/reviews'));
    expect(res.status).toBe(401);
  });
  test('passes through with correct bearer token', () => {
    const res = middleware(makeReq('/api/cron/reviews', undefined, 'Bearer cron-secret-for-tests'));
    expect(res.status).toBe(200);
  });
  test('does not call verifyAdminToken for cron routes', () => {
    middleware(makeReq('/api/cron/reviews', undefined, 'Bearer cron-secret-for-tests'));
    expect(mockVerify).not.toHaveBeenCalled();
  });
});

// ─── Public routes — no interference ─────────────────────────────────────────

describe('middleware — public routes pass through', () => {
  test('/ is allowed', () => {
    const res = middleware(makeReq('/'));
    expect(res.status).toBe(200);
  });
  test('/tours is allowed', () => {
    const res = middleware(makeReq('/tours'));
    expect(res.status).toBe(200);
  });
  test('/api/enquiries is allowed', () => {
    const res = middleware(makeReq('/api/enquiries'));
    expect(res.status).toBe(200);
  });
  test('/api/ai/chat is allowed', () => {
    const res = middleware(makeReq('/api/ai/chat'));
    expect(res.status).toBe(200);
  });
  test('/api/availability is allowed', () => {
    const res = middleware(makeReq('/api/availability'));
    expect(res.status).toBe(200);
  });
});
