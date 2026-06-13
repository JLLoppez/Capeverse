/**
 * Unit tests — lib/reviewMailer.ts
 * Covers: requestReviewForBooking, sendPendingReviewRequests
 * Prisma and mail are mocked throughout
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockSendEmail   = jest.fn().mockResolvedValue({ sent: true });
const mockTransaction = jest.fn();
const mockBookingFindUnique = jest.fn();
const mockFindMany          = jest.fn();

jest.mock('../lib/mail',   () => ({ sendEmail: mockSendEmail }));
jest.mock('../lib/prisma', () => ({
  prisma: {
    booking: {
      findUnique: mockBookingFindUnique,
      findMany:   mockFindMany,
    },
    review: { create: jest.fn() },
    $transaction: mockTransaction,
  },
}));

const mockReview = { id: 'rev_1', reviewToken: 'token_abc', tourId: 'tour_1', bookingId: 'bk_1', submittedAt: null };

const mockBooking = {
  id: 'bk_1', status: 'Confirmed', reviewRequested: false,
  customerName: 'Jane Smith', customerEmail: 'jane@example.com',
  travelDate: new Date('2026-08-01'),
  tour: { id: 'tour_1', title: 'Cape Peninsula Private Tour', slug: 'cape-peninsula' },
};

import { requestReviewForBooking, sendPendingReviewRequests } from '../lib/reviewMailer';

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_BASE_URL = 'https://capeverse.co.za';
  mockTransaction.mockImplementation(async (fn: any) => fn({
    review: { create: jest.fn().mockResolvedValue(mockReview) },
    booking: { update: jest.fn() },
  }));
});
afterEach(() => { delete process.env.NEXT_PUBLIC_BASE_URL; });

// ─── requestReviewForBooking ──────────────────────────────────────────────────

describe('requestReviewForBooking', () => {
  test('sends email for eligible confirmed booking', async () => {
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    await requestReviewForBooking('bk_1');
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });
  test('email goes to correct recipient', async () => {
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    await requestReviewForBooking('bk_1');
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com' })
    );
  });
  test('email subject mentions tour title', async () => {
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    await requestReviewForBooking('bk_1');
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.subject).toContain('Cape Peninsula Private Tour');
  });
  test('email html contains review URL with token', async () => {
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    await requestReviewForBooking('bk_1');
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).toContain('token_abc');
  });
  test('email html contains customer name', async () => {
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    await requestReviewForBooking('bk_1');
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).toContain('Jane Smith');
  });
  test('uses transaction for atomic write', async () => {
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    await requestReviewForBooking('bk_1');
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });
  test('skips booking not found', async () => {
    mockBookingFindUnique.mockResolvedValue(null);
    await requestReviewForBooking('nonexistent');
    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });
  test('skips already-requested booking', async () => {
    mockBookingFindUnique.mockResolvedValue({ ...mockBooking, reviewRequested: true });
    await requestReviewForBooking('bk_1');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
  test('skips non-Confirmed booking', async () => {
    mockBookingFindUnique.mockResolvedValue({ ...mockBooking, status: 'Cancelled' });
    await requestReviewForBooking('bk_1');
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
  test('uses NEXT_PUBLIC_BASE_URL in review link', async () => {
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    await requestReviewForBooking('bk_1');
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).toContain('https://capeverse.co.za/review/');
  });
  test('falls back to default URL when env missing', async () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    await requestReviewForBooking('bk_1');
    const call = mockSendEmail.mock.calls[0][0];
    expect(call.html).toContain('/review/');
  });
  test('does not throw when email fails', async () => {
    mockBookingFindUnique.mockResolvedValue(mockBooking);
    mockSendEmail.mockResolvedValueOnce({ sent: false, reason: 'SMTP down' });
    await expect(requestReviewForBooking('bk_1')).resolves.not.toThrow();
  });
});

// ─── sendPendingReviewRequests ────────────────────────────────────────────────

describe('sendPendingReviewRequests', () => {
  test('returns 0 when no eligible bookings', async () => {
    mockFindMany.mockResolvedValue([]);
    const count = await sendPendingReviewRequests();
    expect(count).toBe(0);
  });
  test('returns count of emails sent', async () => {
    mockFindMany.mockResolvedValue([{ id: 'bk_2' }, { id: 'bk_3' }]);
    mockBookingFindUnique
      .mockResolvedValueOnce({ ...mockBooking, id: 'bk_2' })
      .mockResolvedValueOnce({ ...mockBooking, id: 'bk_3' });
    const count = await sendPendingReviewRequests();
    expect(count).toBe(2);
  });
  test('queries bookings with correct status and reviewRequested=false', async () => {
    mockFindMany.mockResolvedValue([]);
    await sendPendingReviewRequests();
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'Confirmed',
          reviewRequested: false,
        }),
      })
    );
  });
  test('continues processing remaining bookings if one fails', async () => {
    mockFindMany.mockResolvedValue([{ id: 'bk_fail' }, { id: 'bk_ok' }]);
    mockBookingFindUnique
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce({ ...mockBooking, id: 'bk_ok' });
    const count = await sendPendingReviewRequests();
    expect(count).toBe(1); // bk_ok succeeded
  });
  test('does not throw even if all bookings fail', async () => {
    mockFindMany.mockResolvedValue([{ id: 'bk_x' }]);
    mockBookingFindUnique.mockRejectedValue(new Error('crash'));
    await expect(sendPendingReviewRequests()).resolves.not.toThrow();
  });
});
