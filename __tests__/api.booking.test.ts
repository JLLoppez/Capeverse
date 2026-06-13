/**
 * Integration tests — /api/booking/checkout and /api/booking/webhook
 * Covers: Stripe session creation, webhook signature verification,
 *         Booking record creation, email confirmation, funnel tracking
 */

import { POST as checkoutPOST } from '../app/api/booking/checkout/route';
import { POST as webhookPOST }  from '../app/api/booking/webhook/route';

jest.mock('../lib/rateLimit', () => ({ rateLimitResponse: jest.fn().mockReturnValue(null) }));
const mockSendEmail = jest.fn().mockResolvedValue({ sent: true });
jest.mock('../lib/mail', () => ({ sendEmail: mockSendEmail }));

const mockTour = {
  id: 'tour_1', title: 'Cape Peninsula Private Tour',
  slug: 'cape-peninsula', priceFrom: 3200, isActive: true,
};
const mockBooking = {
  id: 'bk_1', tourId: 'tour_1', stripeSessionId: 'cs_test_abc',
  customerName: 'Jane Smith', customerEmail: 'jane@example.com',
  groupSize: 2, amountZar: 6400, status: 'Confirmed',
};
const mockStripeSession = {
  id: 'cs_test_abc', url: 'https://checkout.stripe.com/pay/cs_test_abc',
};
const mockPrisma = {
  tour:         { findUnique: jest.fn().mockResolvedValue(mockTour) },
  booking:      { create: jest.fn().mockResolvedValue(mockBooking) },
  funnelEvent:  { create: jest.fn().mockResolvedValue({}) },
};
jest.mock('../lib/prisma', () => ({ prisma: mockPrisma }));

// Mock Stripe
const mockSessionCreate    = jest.fn().mockResolvedValue(mockStripeSession);
const mockConstructEvent   = jest.fn();
jest.mock('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: mockSessionCreate } },
    webhooks: { constructEvent: mockConstructEvent },
  })),
}));

function makeCheckoutRequest(body: object) {
  return new Request('https://test.local/api/booking/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
    body: JSON.stringify(body),
  });
}

function makeWebhookRequest(body: string, sig: string = 'valid_sig') {
  return new Request('https://test.local/api/booking/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': sig, 'Content-Type': 'application/json' },
    body,
  });
}

const validCheckoutBody = {
  tourId: 'tour_1', groupSize: 2,
  travelDate: '2026-12-01', customerName: 'Jane Smith',
  customerEmail: 'jane@example.com',
};

const checkoutCompletedEvent = {
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_abc',
      customer_email: 'jane@example.com',
      amount_total: 640000, // cents
      metadata: {
        tourId: 'tour_1', customerName: 'Jane Smith',
        travelDate: '2026-12-01', groupSize: '2',
      },
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.STRIPE_SECRET_KEY        = 'sk_test_abc';
  process.env.STRIPE_WEBHOOK_SECRET    = 'whsec_test';
  process.env.NEXT_PUBLIC_BASE_URL     = 'https://capeverse.co.za';
  mockConstructEvent.mockReturnValue(checkoutCompletedEvent);
});
afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.NEXT_PUBLIC_BASE_URL;
});

// ─── /api/booking/checkout ────────────────────────────────────────────────────

describe('POST /api/booking/checkout — success', () => {
  test('returns 200', async () => {
    const res = await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    expect(res.status).toBe(200);
  });
  test('returns checkout URL', async () => {
    const res = await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    const body = await res.json();
    expect(body.url).toBe('https://checkout.stripe.com/pay/cs_test_abc');
  });
  test('creates Stripe session', async () => {
    await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    expect(mockSessionCreate).toHaveBeenCalledTimes(1);
  });
  test('passes tourId in metadata', async () => {
    await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.metadata.tourId).toBe('tour_1');
  });
  test('passes groupSize in metadata', async () => {
    await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.metadata.groupSize).toBe('2');
  });
  test('success URL uses NEXT_PUBLIC_BASE_URL', async () => {
    await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.success_url).toContain('https://capeverse.co.za');
  });
  test('cancel URL uses tour slug', async () => {
    await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    const call = mockSessionCreate.mock.calls[0][0];
    expect(call.cancel_url).toContain('cape-peninsula');
  });
});

describe('POST /api/booking/checkout — error cases', () => {
  test('returns 503 when Stripe not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    expect(res.status).toBe(503);
  });
  test('returns 404 when tour not found', async () => {
    mockPrisma.tour.findUnique.mockResolvedValueOnce(null);
    const res = await checkoutPOST(makeCheckoutRequest(validCheckoutBody));
    expect(res.status).toBe(404);
  });
  test('returns 422 for missing tourId', async () => {
    const { tourId, ...body } = validCheckoutBody;
    const res = await checkoutPOST(makeCheckoutRequest(body));
    expect(res.status).toBe(422);
  });
  test('returns 422 for groupSize=0', async () => {
    const res = await checkoutPOST(makeCheckoutRequest({ ...validCheckoutBody, groupSize: 0 }));
    expect(res.status).toBe(422);
  });
  test('returns 400 for invalid JSON', async () => {
    const req = new Request('https://test.local/api/booking/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '1.2.3.4' },
      body: 'broken json',
    });
    const res = await checkoutPOST(req);
    expect(res.status).toBe(400);
  });
});

// ─── /api/booking/webhook ─────────────────────────────────────────────────────

describe('POST /api/booking/webhook — checkout.session.completed', () => {
  test('returns 200', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    const res = await webhookPOST(makeWebhookRequest(body));
    expect(res.status).toBe(200);
  });
  test('creates Booking record in DB', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    await webhookPOST(makeWebhookRequest(body));
    expect(mockPrisma.booking.create).toHaveBeenCalledTimes(1);
  });
  test('booking record has correct tourId', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    await webhookPOST(makeWebhookRequest(body));
    const data = mockPrisma.booking.create.mock.calls[0][0].data;
    expect(data.tourId).toBe('tour_1');
  });
  test('booking record has correct customerEmail', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    await webhookPOST(makeWebhookRequest(body));
    const data = mockPrisma.booking.create.mock.calls[0][0].data;
    expect(data.customerEmail).toBe('jane@example.com');
  });
  test('booking record status is Confirmed', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    await webhookPOST(makeWebhookRequest(body));
    const data = mockPrisma.booking.create.mock.calls[0][0].data;
    expect(data.status).toBe('Confirmed');
  });
  test('amountZar is converted from cents correctly', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    await webhookPOST(makeWebhookRequest(body));
    const data = mockPrisma.booking.create.mock.calls[0][0].data;
    expect(data.amountZar).toBe(6400); // 640000 cents / 100
  });
  test('sends confirmation email', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    await webhookPOST(makeWebhookRequest(body));
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
  test('confirmation email goes to customer', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    await webhookPOST(makeWebhookRequest(body));
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com' })
    );
  });
  test('tracks completed_booking funnel event', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    await webhookPOST(makeWebhookRequest(body));
    expect(mockPrisma.funnelEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ event: 'completed_booking' }) })
    );
  });
  test('returns received:true', async () => {
    const body = JSON.stringify(checkoutCompletedEvent);
    const res  = await webhookPOST(makeWebhookRequest(body));
    const json = await res.json();
    expect(json.received).toBe(true);
  });
});

describe('POST /api/booking/webhook — signature failure', () => {
  test('returns 400 on invalid signature', async () => {
    mockConstructEvent.mockImplementationOnce(() => { throw new Error('No signatures found'); });
    const res = await webhookPOST(makeWebhookRequest('{}', 'bad_sig'));
    expect(res.status).toBe(400);
  });
  test('does not create booking on bad signature', async () => {
    mockConstructEvent.mockImplementationOnce(() => { throw new Error('Invalid'); });
    await webhookPOST(makeWebhookRequest('{}', 'bad'));
    expect(mockPrisma.booking.create).not.toHaveBeenCalled();
  });
});

describe('POST /api/booking/webhook — not configured', () => {
  test('returns 503 when STRIPE_SECRET_KEY missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const res = await webhookPOST(makeWebhookRequest('{}'));
    expect(res.status).toBe(503);
  });
  test('returns 503 when STRIPE_WEBHOOK_SECRET missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await webhookPOST(makeWebhookRequest('{}'));
    expect(res.status).toBe(503);
  });
});

describe('POST /api/booking/webhook — unhandled event type', () => {
  test('returns 200 and received:true for unknown event types', async () => {
    mockConstructEvent.mockReturnValueOnce({ type: 'payment_intent.created', data: { object: {} } });
    const res = await webhookPOST(makeWebhookRequest('{}'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });
  test('does not create booking for unhandled event', async () => {
    mockConstructEvent.mockReturnValueOnce({ type: 'refund.created', data: { object: {} } });
    await webhookPOST(makeWebhookRequest('{}'));
    expect(mockPrisma.booking.create).not.toHaveBeenCalled();
  });
});
