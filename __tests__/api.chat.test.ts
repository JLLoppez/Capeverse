/**
 * Integration tests — /api/ai/chat
 * Covers: live inventory injection, multi-turn, fallback, rate limit, session IDs
 */

import { POST } from '../app/api/ai/chat/route';

jest.mock('../lib/rateLimit', () => ({ rateLimitResponse: jest.fn().mockReturnValue(null) }));

const mockAttractions = [
  { name: 'Cape Point', region: 'Cape Peninsula', tags: ['scenic','iconic'], estimatedVisitMinutes: 120, shortDescription: 'Dramatic southwestern tip of Africa.' },
  { name: 'Boulders Beach', region: 'Simons Town', tags: ['family','wildlife'], estimatedVisitMinutes: 90, shortDescription: 'African penguin colony near Simon\'s Town.' },
  { name: 'Stellenbosch', region: 'Cape Winelands', tags: ['wine','food'], estimatedVisitMinutes: 180, shortDescription: 'Premier wine town with oak-lined streets.' },
];
const mockPrisma = {
  attraction: { findMany: jest.fn().mockResolvedValue(mockAttractions) },
};
jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

// Mock Gemini instead of OpenAI
const mockGeminiReply = jest.fn().mockResolvedValue('Great choice! Cape Town is wonderful for couples.');
jest.mock('../lib/gemini', () => ({
  chat:               jest.fn().mockImplementation(mockGeminiReply),
  generateText:       jest.fn().mockResolvedValue('A warm clear day — ideal for outdoor exploring.'),
  isGeminiConfigured: jest.fn().mockReturnValue(true),
  generateJSON:       jest.fn().mockResolvedValue({ summary: 'Great itinerary', days: [] }),
}));

function makeRequest(body: object) {
  return new Request('https://test.local/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  messages: [{ role: 'user', content: 'We are a couple visiting for 3 days. We love wine.' }],
  sessionId: 'session_abc123',
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.OPENAI_API_KEY = 'sk-test-key';
});
afterEach(() => { delete process.env.OPENAI_API_KEY; });

describe('POST /api/ai/chat — success with OpenAI', () => {
  test('returns 200', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
  });
  test('returns reply field', async () => {
    const res = await POST(makeRequest(validBody));
    const body = await res.json();
    expect(body.reply).toBeTruthy();
  });
  test('returns sessionId', async () => {
    const res = await POST(makeRequest(validBody));
    const body = await res.json();
    expect(body.sessionId).toBeTruthy();
  });
  test('echoes back provided sessionId', async () => {
    const res = await POST(makeRequest(validBody));
    const body = await res.json();
    expect(body.sessionId).toBe('session_abc123');
  });
  test('generates new sessionId when none provided', async () => {
    const { sessionId, ...noSession } = validBody;
    const res = await POST(makeRequest(noSession));
    const body = await res.json();
    expect(body.sessionId).toBeTruthy();
    expect(typeof body.sessionId).toBe('string');
  });
  test('fetches active attractions from DB for inventory', async () => {
    await POST(makeRequest(validBody));
    expect(mockPrisma.attraction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
  });
  test('injects attraction names into system prompt', async () => {
    await POST(makeRequest(validBody));
    const systemMsg = mockCreate.mock.calls[0][0].messages[0];
    expect(systemMsg.role).toBe('system');
    expect(systemMsg.content).toContain('Cape Point');
    expect(systemMsg.content).toContain('Stellenbosch');
  });
  test('injects attraction regions into system prompt', async () => {
    await POST(makeRequest(validBody));
    const systemMsg = mockCreate.mock.calls[0][0].messages[0];
    expect(systemMsg.content).toContain('Cape Peninsula');
    expect(systemMsg.content).toContain('Cape Winelands');
  });
  test('includes inventory block marker', async () => {
    await POST(makeRequest(validBody));
    const systemMsg = mockCreate.mock.calls[0][0].messages[0];
    expect(systemMsg.content).toContain('<inventory>');
  });
  test('includes user message in chat history', async () => {
    await POST(makeRequest(validBody));
    const messages = mockCreate.mock.calls[0][0].messages;
    const userMsg = messages.find((m: any) => m.role === 'user');
    expect(userMsg.content).toContain('We are a couple visiting for 3 days');
  });
  test('truncates history to last 20 messages', async () => {
    const longHistory = Array.from({ length: 25 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));
    await POST(makeRequest({ ...validBody, messages: longHistory }));
    const messages = mockCreate.mock.calls[0][0].messages;
    // System + up to 20 conversation messages = 21 max
    expect(messages.length).toBeLessThanOrEqual(21);
  });
  test('uses correct model', async () => {
    await POST(makeRequest(validBody));
    const call = mockCreate.mock.calls[0][0];
    expect(call.model).toBe('gpt-4o-mini');
  });
  test('max_tokens is 400', async () => {
    await POST(makeRequest(validBody));
    const call = mockCreate.mock.calls[0][0];
    expect(call.max_tokens).toBe(400);
  });
});

describe('POST /api/ai/chat — local fallback (no OpenAI key)', () => {
  beforeEach(() => { delete process.env.OPENAI_API_KEY; });

  test('returns 200', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
  });
  test('returns a reply string', async () => {
    const res = await POST(makeRequest(validBody));
    const body = await res.json();
    expect(typeof body.reply).toBe('string');
    expect(body.reply.length).toBeGreaterThan(10);
  });
  test('does not call OpenAI', async () => {
    await POST(makeRequest(validBody));
    expect(mockCreate).not.toHaveBeenCalled();
  });
  test('wine keyword triggers wine response', async () => {
    const res = await POST(makeRequest({
      messages: [{ role: 'user', content: 'We love wine and the winelands.' }],
    }));
    const body = await res.json();
    expect(body.reply.toLowerCase()).toMatch(/wine|stellenbosch|franschhoek/);
  });
  test('family keyword triggers family response', async () => {
    const res = await POST(makeRequest({
      messages: [{ role: 'user', content: 'Family of 4 with young kids.' }],
    }));
    const body = await res.json();
    expect(body.reply.toLowerCase()).toMatch(/family|kids|children|boulders|kirstenbosch/);
  });
  test('couple keyword triggers couple response', async () => {
    const res = await POST(makeRequest({
      messages: [{ role: 'user', content: 'Romantic trip for a couple on honeymoon.' }],
    }));
    const body = await res.json();
    expect(body.reply.toLowerCase()).toMatch(/couple|romantic|honeymoon|franschhoek/);
  });
  test('unknown query returns generic helpful response', async () => {
    const res = await POST(makeRequest({
      messages: [{ role: 'user', content: 'Hello' }],
    }));
    const body = await res.json();
    expect(body.reply.length).toBeGreaterThan(20);
  });
});

describe('POST /api/ai/chat — OpenAI error fallback', () => {
  test('falls back to local reply when OpenAI throws', async () => {
    mockCreate.mockRejectedValueOnce(new Error('OpenAI timeout'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toBeTruthy();
  });
});

describe('POST /api/ai/chat — invalid input', () => {
  test('returns 400 for invalid JSON', async () => {
    const req = new Request('https://test.local/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: 'bad json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
  test('handles empty messages array gracefully', async () => {
    const res = await POST(makeRequest({ messages: [], sessionId: 'x' }));
    expect(res.status).toBe(200);
  });
});

describe('POST /api/ai/chat — rate limit', () => {
  test('returns 429 when rate limited', async () => {
    const { rateLimitResponse } = await import('../lib/rateLimit');
    (rateLimitResponse as jest.Mock).mockReturnValueOnce(
      new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
      })
    );
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });
});
