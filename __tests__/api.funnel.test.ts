/**
 * Integration tests — /api/funnel
 * Covers: all valid event types, invalid events, DB write, resilience
 */

import { POST } from '../app/api/funnel/route';

const mockPrisma = {
  funnelEvent: { create: jest.fn().mockResolvedValue({ id: 'fe_1' }) },
};
jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

function makeRequest(body: object) {
  return new Request('https://test.local/api/funnel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => jest.clearAllMocks());

const validEvents = [
  'viewed_tour', 'started_planner', 'generated_itinerary',
  'saved_itinerary', 'submitted_enquiry', 'completed_booking',
];

describe('POST /api/funnel — valid events', () => {
  test.each(validEvents)('accepts event "%s" with 200', async (event) => {
    const res = await POST(makeRequest({ event, sessionId: 'sess_1', path: '/tours' }));
    expect(res.status).toBe(200);
  });
  test.each(validEvents)('creates DB record for "%s"', async (event) => {
    await POST(makeRequest({ event, sessionId: 'sess_1' }));
    expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ event }) })
    );
  });
  test('returns ok: true', async () => {
    const res = await POST(makeRequest({ event: 'viewed_tour', sessionId: 'sess_1' }));
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
  test('stores sessionId when provided', async () => {
    await POST(makeRequest({ event: 'viewed_tour', sessionId: 'my-session-id' }));
    expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sessionId: 'my-session-id' }) })
    );
  });
  test('stores path when provided', async () => {
    await POST(makeRequest({ event: 'viewed_tour', path: '/tours/cape-point' }));
    expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ path: '/tours/cape-point' }) })
    );
  });
  test('stores tourId when provided', async () => {
    await POST(makeRequest({ event: 'viewed_tour', tourId: 'tour_abc' }));
    expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ tourId: 'tour_abc' }) })
    );
  });
  test('stores meta when provided', async () => {
    await POST(makeRequest({ event: 'saved_itinerary', meta: { token: 'abc123' } }));
    expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ meta: { token: 'abc123' } }) })
    );
  });
  test('works without optional fields', async () => {
    const res = await POST(makeRequest({ event: 'viewed_tour' }));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/funnel — invalid events', () => {
  test('rejects unknown event with 422', async () => {
    const res = await POST(makeRequest({ event: 'hacked_event' }));
    expect(res.status).toBe(422);
  });
  test('rejects empty event with 422', async () => {
    const res = await POST(makeRequest({ event: '' }));
    expect(res.status).toBe(422);
  });
  test('rejects missing event with 422', async () => {
    const res = await POST(makeRequest({ sessionId: 'sess_1' }));
    expect(res.status).toBe(422);
  });
  test('rejects invalid JSON with 400', async () => {
    const req = new Request('https://test.local/api/funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: 'not json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
  test('does not create DB record for invalid event', async () => {
    await POST(makeRequest({ event: 'bad_event' }));
    expect(mockPrisma.funnelEvent.create).not.toHaveBeenCalled();
  });
  test('path over 300 chars is rejected with 422', async () => {
    const res = await POST(makeRequest({ event: 'viewed_tour', path: '/'.repeat(301) }));
    expect(res.status).toBe(422);
  });
});

describe('POST /api/funnel — resilience', () => {
  test('returns 200 even when DB write fails', async () => {
    mockPrisma.funnelEvent.create.mockRejectedValueOnce(new Error('DB down'));
    const res = await POST(makeRequest({ event: 'viewed_tour' }));
    expect(res.status).toBe(200);
  });
  test('does not throw when DB fails', async () => {
    mockPrisma.funnelEvent.create.mockRejectedValueOnce(new Error('timeout'));
    await expect(POST(makeRequest({ event: 'viewed_tour' }))).resolves.not.toThrow();
  });
});
