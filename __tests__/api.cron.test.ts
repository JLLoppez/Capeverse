/**
 * Integration tests — /api/cron/reviews
 * Covers: auth guard, successful run, error handling
 */

import { GET } from '../app/api/cron/reviews/route';

const mockSendPending = jest.fn().mockResolvedValue(3);
jest.mock('../lib/reviewMailer', () => ({ sendPendingReviewRequests: mockSendPending }));

function makeRequest(secret?: string) {
  return new Request('https://test.local/api/cron/reviews', {
    headers: secret ? { authorization: `Bearer ${secret}` } : {},
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = 'super-secret-cron-token';
});
afterEach(() => { delete process.env.CRON_SECRET; });

describe('GET /api/cron/reviews', () => {
  test('returns 200 with correct secret', async () => {
    const res = await GET(makeRequest('super-secret-cron-token'));
    expect(res.status).toBe(200);
  });
  test('returns sent count', async () => {
    const res = await GET(makeRequest('super-secret-cron-token'));
    const body = await res.json();
    expect(body.sent).toBe(3);
  });
  test('returns ok: true', async () => {
    const res = await GET(makeRequest('super-secret-cron-token'));
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
  test('calls sendPendingReviewRequests', async () => {
    await GET(makeRequest('super-secret-cron-token'));
    expect(mockSendPending).toHaveBeenCalledTimes(1);
  });
  test('returns 401 with wrong secret', async () => {
    const res = await GET(makeRequest('wrong-secret'));
    expect(res.status).toBe(401);
  });
  test('returns 401 with no secret', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });
  test('returns 401 when CRON_SECRET not set', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(makeRequest('any-value'));
    expect(res.status).toBe(401);
  });
  test('does not call mailer on auth failure', async () => {
    await GET(makeRequest('wrong'));
    expect(mockSendPending).not.toHaveBeenCalled();
  });
  test('returns 401 for empty authorization header', async () => {
    const req = new Request('https://test.local/api/cron/reviews', {
      headers: { authorization: '' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
  test('returns 401 for Bearer without token', async () => {
    const req = new Request('https://test.local/api/cron/reviews', {
      headers: { authorization: 'Bearer ' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
