/**
 * Integration tests — /api/availability (public) and /api/admin/availability
 */

import { GET  as publicGET }  from '../app/api/availability/route';
import { GET  as adminGET,
         POST as adminPOST,
         DELETE as adminDELETE } from '../app/api/admin/availability/route';

jest.mock('../lib/rateLimit', () => ({ rateLimitResponse: jest.fn().mockReturnValue(null) }));
jest.mock('../lib/auth', () => ({
  isAdminAuthenticated: jest.fn().mockResolvedValue(true),
  verifyAdminToken: jest.fn().mockReturnValue(true),
}));

const mockRows = [
  { id: 'av_1', date: new Date('2026-12-25'), maxGroups: 0, note: 'Christmas',      createdAt: new Date() },
  { id: 'av_2', date: new Date('2026-12-31'), maxGroups: 2, note: 'New Year limit', createdAt: new Date() },
];
const mockPrisma = {
  operatorAvailability: {
    findMany:   jest.fn().mockResolvedValue(mockRows),
    upsert:     jest.fn().mockResolvedValue(mockRows[0]),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
  },
};
jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

beforeEach(() => jest.clearAllMocks());

// ─── Public GET /api/availability ────────────────────────────────────────────

describe('GET /api/availability', () => {
  test('returns 200', async () => {
    const res = await publicGET(new Request('https://test.local/api/availability'));
    expect(res.status).toBe(200);
  });
  test('returns blockedDates array', async () => {
    const res = await publicGET(new Request('https://test.local/api/availability'));
    const body = await res.json();
    expect(Array.isArray(body.blockedDates)).toBe(true);
  });
  test('returns limitedDates array', async () => {
    const res = await publicGET(new Request('https://test.local/api/availability'));
    const body = await res.json();
    expect(Array.isArray(body.limitedDates)).toBe(true);
  });
  test('blocked dates contain dates with maxGroups=0', async () => {
    const res = await publicGET(new Request('https://test.local/api/availability'));
    const body = await res.json();
    expect(body.blockedDates).toContain('2026-12-25');
  });
  test('limited dates contain dates with maxGroups>0', async () => {
    const res = await publicGET(new Request('https://test.local/api/availability'));
    const body = await res.json();
    expect(body.limitedDates[0].date).toBe('2026-12-31');
    expect(body.limitedDates[0].maxGroups).toBe(2);
  });
  test('limited dates do NOT appear in blocked dates', async () => {
    const res = await publicGET(new Request('https://test.local/api/availability'));
    const body = await res.json();
    expect(body.blockedDates).not.toContain('2026-12-31');
  });
  test('date format is YYYY-MM-DD', async () => {
    const res = await publicGET(new Request('https://test.local/api/availability'));
    const body = await res.json();
    expect(body.blockedDates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  test('queries next 365 days only', async () => {
    await publicGET(new Request('https://test.local/api/availability'));
    const call = mockPrisma.operatorAvailability.findMany.mock.calls[0][0];
    expect(call.where.date.gte).toBeInstanceOf(Date);
    expect(call.where.date.lte).toBeInstanceOf(Date);
  });
});

// ─── Admin GET /api/admin/availability ────────────────────────────────────────

describe('GET /api/admin/availability', () => {
  test('returns 200', async () => {
    const res = await adminGET(new Request('https://test.local/api/admin/availability'));
    expect(res.status).toBe(200);
  });
  test('returns array of availability rows', async () => {
    const res = await adminGET(new Request('https://test.local/api/admin/availability'));
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
  });
});

// ─── Admin POST /api/admin/availability ──────────────────────────────────────

describe('POST /api/admin/availability', () => {
  function makeRequest(body: object) {
    return new Request('https://test.local/api/admin/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  test('returns 201 for valid block', async () => {
    const res = await adminPOST(makeRequest({ date: '2026-12-25', maxGroups: 0, note: 'Christmas' }));
    expect(res.status).toBe(201);
  });
  test('upserts in DB', async () => {
    await adminPOST(makeRequest({ date: '2026-12-25', maxGroups: 0 }));
    expect(mockPrisma.operatorAvailability.upsert).toHaveBeenCalledTimes(1);
  });
  test('accepts maxGroups=0 (full block)', async () => {
    const res = await adminPOST(makeRequest({ date: '2026-12-25', maxGroups: 0 }));
    expect(res.status).toBe(201);
  });
  test('accepts maxGroups>0 (capacity limit)', async () => {
    const res = await adminPOST(makeRequest({ date: '2026-12-25', maxGroups: 3 }));
    expect(res.status).toBe(201);
  });
  test('rejects invalid date format with 422', async () => {
    const res = await adminPOST(makeRequest({ date: '25/12/2026', maxGroups: 0 }));
    expect(res.status).toBe(422);
  });
  test('rejects negative maxGroups with 422', async () => {
    const res = await adminPOST(makeRequest({ date: '2026-12-25', maxGroups: -1 }));
    expect(res.status).toBe(422);
  });
  test('rejects missing date with 422', async () => {
    const res = await adminPOST(makeRequest({ maxGroups: 0 }));
    expect(res.status).toBe(422);
  });
});

// ─── Admin DELETE /api/admin/availability ────────────────────────────────────

describe('DELETE /api/admin/availability', () => {
  test('returns 200 on valid delete', async () => {
    const res = await adminDELETE(new Request('https://test.local/api/admin/availability?date=2026-12-25'));
    expect(res.status).toBe(200);
  });
  test('calls deleteMany in DB', async () => {
    await adminDELETE(new Request('https://test.local/api/admin/availability?date=2026-12-25'));
    expect(mockPrisma.operatorAvailability.deleteMany).toHaveBeenCalledTimes(1);
  });
  test('returns 400 when date param missing', async () => {
    const res = await adminDELETE(new Request('https://test.local/api/admin/availability'));
    expect(res.status).toBe(400);
  });
  test('returns ok: true on success', async () => {
    const res = await adminDELETE(new Request('https://test.local/api/admin/availability?date=2026-12-25'));
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
