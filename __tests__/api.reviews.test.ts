/**
 * Integration tests — /api/reviews/submit and /api/reviews/validate
 */

import { POST as submitPOST } from '../app/api/reviews/submit/route';
import { GET  as validateGET } from '../app/api/reviews/validate/route';

jest.mock('../lib/rateLimit', () => ({ rateLimitResponse: jest.fn().mockReturnValue(null) }));

const mockReview = {
  id: 'rev_1', reviewToken: 'token_valid', tourId: 'tour_1',
  submittedAt: null, approved: false,
};
const mockPrisma = {
  review: {
    findUnique: jest.fn().mockResolvedValue(mockReview),
    update:     jest.fn().mockResolvedValue({ ...mockReview, submittedAt: new Date(), rating: 5, body: 'Wonderful.', authorName: 'Jane' }),
  },
};
jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

function makeSubmitRequest(body: object) {
  return new Request('https://test.local/api/reviews/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}
function makeValidateRequest(token: string) {
  return new Request(`https://test.local/api/reviews/validate?token=${token}`);
}

const validSubmit = {
  token: 'token_valid', rating: 5,
  body: 'This was a wonderful experience. Highly recommend.',
  authorName: 'Jane Smith',
};

beforeEach(() => jest.clearAllMocks());

// ─── /api/reviews/validate ────────────────────────────────────────────────────

describe('GET /api/reviews/validate', () => {
  test('returns 200 for valid unsubmitted token', async () => {
    const res = await validateGET(makeValidateRequest('token_valid'));
    expect(res.status).toBe(200);
  });
  test('returns tourId in response', async () => {
    const res = await validateGET(makeValidateRequest('token_valid'));
    const body = await res.json();
    expect(body.tourId).toBe('tour_1');
  });
  test('returns 404 for nonexistent token', async () => {
    mockPrisma.review.findUnique.mockResolvedValueOnce(null);
    const res = await validateGET(makeValidateRequest('bad_token'));
    expect(res.status).toBe(404);
  });
  test('returns 409 for already-submitted review', async () => {
    mockPrisma.review.findUnique.mockResolvedValueOnce({ ...mockReview, submittedAt: new Date() });
    const res = await validateGET(makeValidateRequest('token_valid'));
    expect(res.status).toBe(409);
  });
  test('returns 400 when token param missing', async () => {
    const res = await validateGET(new Request('https://test.local/api/reviews/validate'));
    expect(res.status).toBe(400);
  });
});

// ─── /api/reviews/submit ──────────────────────────────────────────────────────

describe('POST /api/reviews/submit — success', () => {
  test('returns 200 on valid submission', async () => {
    const res = await submitPOST(makeSubmitRequest(validSubmit));
    expect(res.status).toBe(200);
  });
  test('returns ok: true', async () => {
    const res = await submitPOST(makeSubmitRequest(validSubmit));
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
  test('updates review in DB with rating', async () => {
    await submitPOST(makeSubmitRequest(validSubmit));
    expect(mockPrisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ rating: 5 }) })
    );
  });
  test('updates review in DB with body text', async () => {
    await submitPOST(makeSubmitRequest(validSubmit));
    expect(mockPrisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ body: validSubmit.body }) })
    );
  });
  test('updates review with submittedAt timestamp', async () => {
    await submitPOST(makeSubmitRequest(validSubmit));
    const call = mockPrisma.review.update.mock.calls[0][0].data;
    expect(call.submittedAt).toBeInstanceOf(Date);
  });
  test('accepts rating 1', async () => {
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, rating: 1 }));
    expect(res.status).toBe(200);
  });
  test('accepts rating 5', async () => {
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, rating: 5 }));
    expect(res.status).toBe(200);
  });
  test('accepts body of exactly 1200 chars', async () => {
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, body: 'a'.repeat(1200) }));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/reviews/submit — validation', () => {
  test('rejects rating 0 with 422', async () => {
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, rating: 0 }));
    expect(res.status).toBe(422);
  });
  test('rejects rating 6 with 422', async () => {
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, rating: 6 }));
    expect(res.status).toBe(422);
  });
  test('rejects body under 10 chars with 422', async () => {
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, body: 'short' }));
    expect(res.status).toBe(422);
  });
  test('rejects body over 1200 chars with 422', async () => {
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, body: 'a'.repeat(1201) }));
    expect(res.status).toBe(422);
  });
  test('rejects authorName under 2 chars with 422', async () => {
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, authorName: 'J' }));
    expect(res.status).toBe(422);
  });
  test('rejects missing token with 422', async () => {
    const { token, ...noToken } = validSubmit;
    const res = await submitPOST(makeSubmitRequest(noToken));
    expect(res.status).toBe(422);
  });
  test('rejects invalid JSON with 400', async () => {
    const req = new Request('https://test.local/api/reviews/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' }, body: 'bad',
    });
    const res = await submitPOST(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/reviews/submit — conflict', () => {
  test('returns 404 for invalid token', async () => {
    mockPrisma.review.findUnique.mockResolvedValueOnce(null);
    const res = await submitPOST(makeSubmitRequest({ ...validSubmit, token: 'bad_token' }));
    expect(res.status).toBe(404);
  });
  test('returns 409 for already-submitted review', async () => {
    mockPrisma.review.findUnique.mockResolvedValueOnce({ ...mockReview, submittedAt: new Date() });
    const res = await submitPOST(makeSubmitRequest(validSubmit));
    expect(res.status).toBe(409);
  });
  test('does not update DB for already-submitted review', async () => {
    mockPrisma.review.findUnique.mockResolvedValueOnce({ ...mockReview, submittedAt: new Date() });
    await submitPOST(makeSubmitRequest(validSubmit));
    expect(mockPrisma.review.update).not.toHaveBeenCalled();
  });
});
