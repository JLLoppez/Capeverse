/**
 * Integration tests — /api/enquiries (POST)
 * Covers: validation, DB write, notification email, funnel tracking, error cases
 */

import { POST } from '../app/api/enquiries/route';

jest.mock('../lib/rateLimit', () => ({ rateLimitResponse: jest.fn().mockReturnValue(null) }));
const mockSendEmail = jest.fn().mockResolvedValue({ sent: true });
jest.mock('../lib/mail', () => ({ sendEmail: mockSendEmail }));

const mockEnquiry = {
  id: 'enq_1', fullName: 'Jane Smith', email: 'jane@example.com',
  status: 'New', createdAt: new Date(),
};
const mockPrisma = {
  enquiry: { create: jest.fn().mockResolvedValue(mockEnquiry) },
  funnelEvent: { create: jest.fn().mockResolvedValue({}) },
};
jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

function makeRequest(body: object) {
  return new Request('https://test.local/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  fullName: 'Jane Smith', email: 'jane@example.com',
  phone: null, nationality: null, travelDate: null,
  groupSize: null, budgetRange: null, tripLengthDays: null, message: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.ADMIN_NOTIFICATION_EMAIL = 'admin@capeverse.co.za';
});
afterEach(() => { delete process.env.ADMIN_NOTIFICATION_EMAIL; });

describe('POST /api/enquiries — success', () => {
  test('returns 201 on valid input', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
  });
  test('creates enquiry in DB', async () => {
    await POST(makeRequest(validBody));
    expect(mockPrisma.enquiry.create).toHaveBeenCalledTimes(1);
  });
  test('saves fullName to DB', async () => {
    await POST(makeRequest(validBody));
    const data = mockPrisma.enquiry.create.mock.calls[0][0].data;
    expect(data.fullName).toBe('Jane Smith');
  });
  test('saves email to DB', async () => {
    await POST(makeRequest(validBody));
    const data = mockPrisma.enquiry.create.mock.calls[0][0].data;
    expect(data.email).toBe('jane@example.com');
  });
  test('sends two emails (admin + traveller)', async () => {
    await POST(makeRequest(validBody));
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });
  test('admin notification goes to ADMIN_NOTIFICATION_EMAIL', async () => {
    await POST(makeRequest(validBody));
    const recipients = mockSendEmail.mock.calls.map((c: any) => c[0].to);
    expect(recipients).toContain('admin@capeverse.co.za');
  });
  test('traveller confirmation goes to submitter email', async () => {
    await POST(makeRequest(validBody));
    const recipients = mockSendEmail.mock.calls.map((c: any) => c[0].to);
    expect(recipients).toContain('jane@example.com');
  });
  test('tracks submitted_enquiry funnel event', async () => {
    await POST(makeRequest(validBody));
    expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ event: 'submitted_enquiry' }) })
    );
  });
  test('returns enquiry id in response', async () => {
    const res = await POST(makeRequest(validBody));
    const body = await res.json();
    expect(body.id).toBe('enq_1');
  });
  test('accepts full enquiry with all optional fields', async () => {
    const fullBody = {
      fullName: 'John Doe', email: 'john@example.com',
      phone: '+27761234567', nationality: 'British',
      travelDate: '2026-12-01', groupSize: '4',
      budgetRange: 'Luxury', tripLengthDays: '7',
      message: 'We love wine and penguins and scenic drives.',
    };
    const res = await POST(makeRequest(fullBody));
    expect(res.status).toBe(201);
  });
});

describe('POST /api/enquiries — validation', () => {
  test('rejects missing fullName with 422', async () => {
    const { fullName, ...body } = validBody;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(422);
  });
  test('rejects empty fullName with 422', async () => {
    const res = await POST(makeRequest({ ...validBody, fullName: '' }));
    expect(res.status).toBe(422);
  });
  test('rejects missing email with 422', async () => {
    const { email, ...body } = validBody;
    const res = await POST(makeRequest(body));
    expect(res.status).toBe(422);
  });
  test('rejects invalid email with 422', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'not-an-email' }));
    expect(res.status).toBe(422);
  });
  test('rejects invalid JSON with 400', async () => {
    const req = new Request('https://test.local/api/enquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: 'not valid json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
  test('validation error body has error field', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'bad' }));
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });
});

describe('POST /api/enquiries — resilience', () => {
  test('still returns 201 if email fails (non-critical)', async () => {
    mockSendEmail.mockResolvedValue({ sent: false, reason: 'SMTP down' });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
  });
  test('still returns 201 if funnel event fails', async () => {
    mockPrisma.funnelEvent.create.mockRejectedValueOnce(new Error('DB error'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(201);
  });
});
