/**
 * Integration tests — admin API routes
 * Covers: login, logout, enquiry update, review approve,
 *         availability CRUD, funnel events, analytics
 */

import { POST as loginPOST }  from '../app/api/admin/login/route';
import { POST as logoutPOST } from '../app/api/admin/logout/route';
import { POST as enquiryUpdatePOST } from '../app/api/admin/enquiries/[id]/route';

jest.mock('../lib/rateLimit', () => ({ rateLimitResponse: jest.fn().mockReturnValue(null) }));
const mockSendEmail = jest.fn().mockResolvedValue({ sent: true });
jest.mock('../lib/mail', () => ({ sendEmail: mockSendEmail }));

const mockEnquiry = {
  id: 'enq_1', fullName: 'Jane Smith', email: 'jane@example.com',
  status: 'New', consultantNotes: null, createdAt: new Date(),
};
const mockPrisma = {
  enquiry: {
    findUnique: jest.fn().mockResolvedValue(mockEnquiry),
    update:     jest.fn().mockResolvedValue({ ...mockEnquiry, status: 'Contacted' }),
  },
  review: { update: jest.fn().mockResolvedValue({ id: 'rev_1', approved: true }) },
  operatorAvailability: {
    findMany:       jest.fn().mockResolvedValue([]),
    upsert:         jest.fn().mockResolvedValue({ id: 'av_1', date: new Date('2026-12-25'), maxGroups: 0, note: null }),
    deleteMany:     jest.fn().mockResolvedValue({ count: 1 }),
  },
  funnelEvent: {
    groupBy:  jest.fn().mockResolvedValue([]),
    create:   jest.fn().mockResolvedValue({}),
  },
  tour:             { count: jest.fn().mockResolvedValue(5) },
  attraction:       { count: jest.fn().mockResolvedValue(12) },
  booking:          { aggregate: jest.fn().mockResolvedValue({ _sum: { amountZar: 180000 }, _count: { id: 6 } }) },
  savedItinerary:   { count: jest.fn().mockResolvedValue(24) },
  pageView:         { groupBy: jest.fn().mockResolvedValue([]) },
};
jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

// Mock middleware auth check — admin routes use isAdminAuthenticated
jest.mock('../lib/auth', () => ({
  isAdminAuthenticated: jest.fn().mockResolvedValue(true),
  createAdminToken:     jest.fn().mockReturnValue('valid.token'),
  verifyAdminToken:     jest.fn().mockReturnValue(true),
  requireAdmin:         jest.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_EMAIL    = 'admin@capeverse.co.za';
  process.env.ADMIN_PASSWORD = 'correct-password-123';
  process.env.ADMIN_SESSION_SECRET = 'a-32-char-secret-for-testing-ok!';
});
afterEach(() => {
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
});

// ─── /api/admin/login ─────────────────────────────────────────────────────────

describe('POST /api/admin/login — success', () => {
  function makeLoginRequest(email: string, password: string) {
    return new Request('https://test.local/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  test('returns 200 on correct credentials', async () => {
    const res = await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'correct-password-123'));
    expect(res.status).toBe(200);
  });
  test('sets cape_admin_session cookie on success', async () => {
    const res = await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'correct-password-123'));
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toBeTruthy();
    expect(cookie).toContain('cape_admin_session');
  });
  test('cookie is HttpOnly', async () => {
    const res = await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'correct-password-123'));
    const cookie = res.headers.get('set-cookie');
    expect(cookie?.toLowerCase()).toContain('httponly');
  });
  test('cookie has Path=/', async () => {
    const res = await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'correct-password-123'));
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('Path=/');
  });
  test('returns ok: true in body', async () => {
    const res = await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'correct-password-123'));
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});

describe('POST /api/admin/login — failure', () => {
  function makeLoginRequest(email: string, password: string) {
    return new Request('https://test.local/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  test('returns 401 on wrong password', async () => {
    const res = await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'wrong-password'));
    expect(res.status).toBe(401);
  });
  test('returns 401 on wrong email', async () => {
    const res = await loginPOST(makeLoginRequest('hacker@evil.com', 'correct-password-123'));
    expect(res.status).toBe(401);
  });
  test('returns 401 on empty credentials', async () => {
    const res = await loginPOST(makeLoginRequest('', ''));
    expect(res.status).toBe(401);
  });
  test('does not set cookie on failure', async () => {
    const res = await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'wrong'));
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toBeFalsy();
  });
  test('returns error field on failure', async () => {
    const res = await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'wrong'));
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
  test('returns 400 on invalid JSON', async () => {
    const req = new Request('https://test.local/api/admin/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'bad',
    });
    const res = await loginPOST(req);
    expect(res.status).toBe(400);
  });
  test('timing is consistent (no oracle leak) — rough check', async () => {
    const t1 = Date.now();
    await loginPOST(makeLoginRequest('admin@capeverse.co.za', 'wrong'));
    const t2 = Date.now();
    await loginPOST(makeLoginRequest('notexist@example.com', 'wrong'));
    const t3 = Date.now();
    // Both should be fast but roughly equal (within 50ms of each other)
    expect(Math.abs((t2 - t1) - (t3 - t2))).toBeLessThan(50);
  });
});

// ─── /api/admin/logout ────────────────────────────────────────────────────────

describe('POST /api/admin/logout', () => {
  function makeLogoutRequest() {
    return new Request('https://test.local/api/admin/logout', {
      method: 'POST',
      headers: { 'Cookie': 'cape_admin_session=valid.token' },
    });
  }

  test('returns 200', async () => {
    const res = await logoutPOST(makeLogoutRequest());
    expect(res.status).toBe(200);
  });
  test('clears the session cookie', async () => {
    const res = await logoutPOST(makeLogoutRequest());
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('cape_admin_session=');
    // Cookie should expire in the past (MaxAge=0 or Expires in past)
    expect(cookie?.toLowerCase()).toMatch(/max-age=0|expires=.*1970/);
  });
});

// ─── /api/admin/enquiries/[id] ────────────────────────────────────────────────

describe('POST /api/admin/enquiries/[id] — update', () => {
  function makeUpdateRequest(body: object) {
    return new Request('https://test.local/api/admin/enquiries/enq_1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': 'cape_admin_session=valid.token' },
      body: JSON.stringify(body),
    });
  }

  test('returns 200 on valid update', async () => {
    const res = await enquiryUpdatePOST(makeUpdateRequest({ status: 'Contacted', consultantNotes: 'Called client.' }), { params: { id: 'enq_1' } });
    expect(res.status).toBe(200);
  });
  test('updates status in DB', async () => {
    await enquiryUpdatePOST(makeUpdateRequest({ status: 'Contacted', consultantNotes: '' }), { params: { id: 'enq_1' } });
    expect(mockPrisma.enquiry.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'enq_1' }, data: expect.objectContaining({ status: 'Contacted' }) })
    );
  });
  test('sends update email to client when notes added', async () => {
    await enquiryUpdatePOST(makeUpdateRequest({ status: 'Quote Sent', consultantNotes: 'Quote attached.' }), { params: { id: 'enq_1' } });
    expect(mockSendEmail).toHaveBeenCalled();
  });
  test('email goes to enquiry email address', async () => {
    await enquiryUpdatePOST(makeUpdateRequest({ status: 'Contacted', consultantNotes: 'Hello!' }), { params: { id: 'enq_1' } });
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.to).toBe('jane@example.com');
  });
  test('returns 404 for nonexistent enquiry', async () => {
    mockPrisma.enquiry.findUnique.mockResolvedValueOnce(null);
    const res = await enquiryUpdatePOST(makeUpdateRequest({ status: 'New' }), { params: { id: 'nonexistent' } });
    expect(res.status).toBe(404);
  });
});
