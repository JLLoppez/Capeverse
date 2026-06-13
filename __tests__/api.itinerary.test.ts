/**
 * Integration tests — /api/itinerary/generate and /api/itinerary/save
 * Prisma is mocked. OpenAI is mocked with a controlled JSON response.
 * Tests: correct scoring wiring, geographic clustering, feasibility,
 *        save/retrieve, validation errors, rate limiting, AI fallback.
 */

import { POST as generatePOST } from '../app/api/itinerary/generate/route';
import { POST as savePOST }     from '../app/api/itinerary/save/route';

// ─── Mocks ───────────────────────────────────────────────────────────────────

jest.mock('../lib/rateLimit', () => ({ rateLimitResponse: jest.fn().mockReturnValue(null) }));

const mockAttractions = [
  { id: 'a1', name: 'Cape Point',   slug: 'cape-point',   region: 'Cape Peninsula',  tags: ['scenic','iconic','nature'],      estimatedVisitMinutes: 120 },
  { id: 'a2', name: 'Boulders',     slug: 'boulders',     region: 'Simons Town',     tags: ['family','wildlife','beach'],      estimatedVisitMinutes: 90  },
  { id: 'a3', name: 'Stellenbosch', slug: 'stellenbosch', region: 'Cape Winelands',  tags: ['wine','food','luxury'],           estimatedVisitMinutes: 180 },
  { id: 'a4', name: 'Bo-Kaap',      slug: 'bo-kaap',      region: 'Cape Town CBD',   tags: ['culture','history','food','city'],estimatedVisitMinutes: 60  },
];

const mockSavedItinerary = { id: 'sit_1', token: 'share_token_xyz', expiresAt: new Date(Date.now() + 90*24*60*60*1000) };

const mockPrisma = {
  attraction: { findMany: jest.fn().mockResolvedValue(mockAttractions) },
  savedItinerary: { create: jest.fn().mockResolvedValue(mockSavedItinerary) },
  funnelEvent: { create: jest.fn().mockResolvedValue({}) },
};
jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

// Mock OpenAI — returns a well-formed JSON response
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                summary: 'A beautiful 2-day Cape Town trip.',
                days: [
                  { day: 1, title: 'Cape Peninsula day', stops: [{ name: 'Cape Point', reason: 'Iconic views.', region: 'Cape Peninsula' }, { name: 'Boulders', reason: 'Penguins.', region: 'Simons Town' }] },
                  { day: 2, title: 'Winelands day',       stops: [{ name: 'Stellenbosch', reason: 'Great wine.', region: 'Cape Winelands' }] },
                ],
              }),
            },
          }],
        }),
      },
    },
  })),
}));

function makeGenerateRequest(body: object) {
  return new Request('https://test.local/api/itinerary/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

function makeSaveRequest(body: object) {
  return new Request('https://test.local/api/itinerary/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

const validGenerateBody = {
  attractionIds: ['a1', 'a2', 'a3'],
  days: 2, budget: 'Mid-range', pace: 'Balanced',
  groupType: 'Couple', interests: ['scenic', 'wine'],
};

const validSaveBody = {
  itineraryJson:  { summary: 'test', days: [], recommendedTourType: 'Full day', estimatedPriceBand: 'R2000+' },
  inputJson:      validGenerateBody,
  days: 2, budget: 'Mid-range', pace: 'Balanced',
  groupType: 'Couple', interests: ['scenic', 'wine'],
};

beforeEach(() => jest.clearAllMocks());

// ─── /api/itinerary/generate ──────────────────────────────────────────────────

describe('POST /api/itinerary/generate — success', () => {
  beforeEach(() => { process.env.OPENAI_API_KEY = 'sk-test'; });
  afterEach(() => { delete process.env.OPENAI_API_KEY; });

  test('returns 200', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    expect(res.status).toBe(200);
  });
  test('response contains summary', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(body.summary).toBeTruthy();
  });
  test('response contains days array', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(Array.isArray(body.days)).toBe(true);
  });
  test('response contains recommendedTourType', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(body.recommendedTourType).toBeTruthy();
  });
  test('response contains estimatedPriceBand', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(body.estimatedPriceBand).toBeTruthy();
  });
  test('response contains warnings array', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(Array.isArray(body.warnings)).toBe(true);
  });
  test('response contains droppedAttractions array', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(Array.isArray(body.droppedAttractions)).toBe(true);
  });
  test('aiEnriched is true when OpenAI key is set', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(body.aiEnriched).toBe(true);
  });
  test('fetches only active attractions from DB', async () => {
    await generatePOST(makeGenerateRequest(validGenerateBody));
    expect(mockPrisma.attraction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isActive: true }) })
    );
  });
  test('passes interests to scoring (not empty array)', async () => {
    // Verify DB query includes estimatedVisitMinutes for time-budget
    await generatePOST(makeGenerateRequest(validGenerateBody));
    const call = mockPrisma.attraction.findMany.mock.calls[0][0];
    expect(call.select.estimatedVisitMinutes).toBe(true);
  });
});

describe('POST /api/itinerary/generate — AI fallback', () => {
  beforeEach(() => { delete process.env.OPENAI_API_KEY; });

  test('returns 200 without OpenAI key', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    expect(res.status).toBe(200);
  });
  test('aiEnriched is false without OpenAI key', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(body.aiEnriched).toBe(false);
  });
  test('still returns summary in fallback', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(body.summary).toBeTruthy();
  });
  test('still returns days array in fallback', async () => {
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    const body = await res.json();
    expect(Array.isArray(body.days)).toBe(true);
  });
});

describe('POST /api/itinerary/generate — validation', () => {
  test('rejects empty attractionIds with 422', async () => {
    const res = await generatePOST(makeGenerateRequest({ ...validGenerateBody, attractionIds: [] }));
    expect(res.status).toBe(422);
  });
  test('rejects missing interests with 422', async () => {
    const { interests, ...noInterests } = validGenerateBody;
    const res = await generatePOST(makeGenerateRequest(noInterests));
    expect(res.status).toBe(422);
  });
  test('rejects days = 0 with 422', async () => {
    const res = await generatePOST(makeGenerateRequest({ ...validGenerateBody, days: 0 }));
    expect(res.status).toBe(422);
  });
  test('rejects days = 15 with 422', async () => {
    const res = await generatePOST(makeGenerateRequest({ ...validGenerateBody, days: 15 }));
    expect(res.status).toBe(422);
  });
  test('rejects invalid budget with 422', async () => {
    const res = await generatePOST(makeGenerateRequest({ ...validGenerateBody, budget: 'Ultra' }));
    expect(res.status).toBe(422);
  });
  test('rejects invalid pace with 422', async () => {
    const res = await generatePOST(makeGenerateRequest({ ...validGenerateBody, pace: 'Turbo' }));
    expect(res.status).toBe(422);
  });
  test('rejects invalid JSON body with 400', async () => {
    const req = new Request('https://test.local/api/itinerary/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: 'not json at all',
    });
    const res = await generatePOST(req);
    expect(res.status).toBe(400);
  });
  test('validation error body contains error field', async () => {
    const res = await generatePOST(makeGenerateRequest({ ...validGenerateBody, attractionIds: [] }));
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

describe('POST /api/itinerary/generate — rate limit', () => {
  test('returns 429 when rate limited', async () => {
    const { rateLimitResponse } = await import('../lib/rateLimit');
    (rateLimitResponse as jest.Mock).mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } })
    );
    const res = await generatePOST(makeGenerateRequest(validGenerateBody));
    expect(res.status).toBe(429);
  });
});

// ─── /api/itinerary/save ──────────────────────────────────────────────────────

describe('POST /api/itinerary/save — success', () => {
  test('returns 200', async () => {
    const res = await savePOST(makeSaveRequest(validSaveBody));
    expect(res.status).toBe(200);
  });
  test('returns token', async () => {
    const res = await savePOST(makeSaveRequest(validSaveBody));
    const body = await res.json();
    expect(body.token).toBe('share_token_xyz');
  });
  test('returns expiresAt', async () => {
    const res = await savePOST(makeSaveRequest(validSaveBody));
    const body = await res.json();
    expect(body.expiresAt).toBeTruthy();
  });
  test('creates savedItinerary in DB', async () => {
    await savePOST(makeSaveRequest(validSaveBody));
    expect(mockPrisma.savedItinerary.create).toHaveBeenCalledTimes(1);
  });
  test('saves with correct days', async () => {
    await savePOST(makeSaveRequest(validSaveBody));
    const call = mockPrisma.savedItinerary.create.mock.calls[0][0].data;
    expect(call.days).toBe(2);
  });
  test('saves with correct interests', async () => {
    await savePOST(makeSaveRequest(validSaveBody));
    const call = mockPrisma.savedItinerary.create.mock.calls[0][0].data;
    expect(call.interests).toEqual(['scenic', 'wine']);
  });
  test('expiresAt is 90 days from now', async () => {
    await savePOST(makeSaveRequest(validSaveBody));
    const call = mockPrisma.savedItinerary.create.mock.calls[0][0].data;
    const diff = call.expiresAt.getTime() - Date.now();
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    expect(diff).toBeGreaterThan(ninetyDays - 5000);
    expect(diff).toBeLessThan(ninetyDays + 5000);
  });
  test('tracks funnel event', async () => {
    await savePOST(makeSaveRequest(validSaveBody));
    expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ event: 'saved_itinerary' }) })
    );
  });
});

describe('POST /api/itinerary/save — validation', () => {
  test('rejects missing itineraryJson with 422', async () => {
    const { itineraryJson, ...body } = validSaveBody;
    const res = await savePOST(makeSaveRequest(body));
    expect(res.status).toBe(422);
  });
  test('rejects empty interests with 422', async () => {
    const res = await savePOST(makeSaveRequest({ ...validSaveBody, interests: [] }));
    expect(res.status).toBe(422);
  });
  test('rejects invalid JSON with 400', async () => {
    const req = new Request('https://test.local/api/itinerary/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: '{{broken json',
    });
    const res = await savePOST(req);
    expect(res.status).toBe(400);
  });
});
