/**
 * Unit tests — lib/mail.ts
 * Covers: sendEmail, all transport paths, error handling
 */

// Mock nodemailer before importing mail
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id-123' }),
    verify:   jest.fn().mockResolvedValue(true),
  })),
}));

import nodemailer from 'nodemailer';
import { sendEmail } from '../lib/mail';

const mockTransport = {
  sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id-123' }),
  verify:   jest.fn().mockResolvedValue(true),
};
(nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransport);

const validPayload = {
  to:      'recipient@example.com',
  subject: 'Test subject',
  html:    '<p>Hello</p>',
  text:    'Hello',
};

beforeEach(() => jest.clearAllMocks());

// ─── SMTP configured ──────────────────────────────────────────────────────────

describe('sendEmail — SMTP configured', () => {
  beforeEach(() => {
    process.env.SMTP_HOST = 'smtp.resend.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'resend';
    process.env.SMTP_PASS = 're_testkey123';
    process.env.FROM_EMAIL = 'Capeverse <hello@capeverse.co.za>';
  });
  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.FROM_EMAIL;
  });

  test('returns sent: true on success', async () => {
    const result = await sendEmail(validPayload);
    expect(result.sent).toBe(true);
  });
  test('calls sendMail once', async () => {
    await sendEmail(validPayload);
    expect(mockTransport.sendMail).toHaveBeenCalledTimes(1);
  });
  test('passes correct to address', async () => {
    await sendEmail(validPayload);
    const call = mockTransport.sendMail.mock.calls[0][0];
    expect(call.to).toBe('recipient@example.com');
  });
  test('passes correct subject', async () => {
    await sendEmail(validPayload);
    const call = mockTransport.sendMail.mock.calls[0][0];
    expect(call.subject).toBe('Test subject');
  });
  test('passes correct html body', async () => {
    await sendEmail(validPayload);
    const call = mockTransport.sendMail.mock.calls[0][0];
    expect(call.html).toBe('<p>Hello</p>');
  });
  test('passes correct text body', async () => {
    await sendEmail(validPayload);
    const call = mockTransport.sendMail.mock.calls[0][0];
    expect(call.text).toBe('Hello');
  });
  test('uses FROM_EMAIL as from address', async () => {
    await sendEmail(validPayload);
    const call = mockTransport.sendMail.mock.calls[0][0];
    expect(call.from).toBe('Capeverse <hello@capeverse.co.za>');
  });
  test('falls back to default from when FROM_EMAIL unset', async () => {
    delete process.env.FROM_EMAIL;
    await sendEmail(validPayload);
    const call = mockTransport.sendMail.mock.calls[0][0];
    expect(call.from).toBeTruthy();
  });
  test('works with html-only (no text)', async () => {
    const { text, ...noText } = validPayload;
    const result = await sendEmail(noText);
    expect(result.sent).toBe(true);
  });
  test('creates transport with correct host', async () => {
    await sendEmail(validPayload);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.resend.com' })
    );
  });
  test('creates transport with correct port', async () => {
    await sendEmail(validPayload);
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587 })
    );
  });
});

// ─── SMTP not configured ──────────────────────────────────────────────────────

describe('sendEmail — SMTP not configured', () => {
  beforeEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  test('returns sent: false', async () => {
    const result = await sendEmail(validPayload);
    expect(result.sent).toBe(false);
  });
  test('returns a reason string', async () => {
    const result = await sendEmail(validPayload);
    expect(typeof result.reason).toBe('string');
    expect((result.reason as string).length).toBeGreaterThan(0);
  });
  test('does NOT call sendMail', async () => {
    await sendEmail(validPayload);
    expect(mockTransport.sendMail).not.toHaveBeenCalled();
  });
});

// ─── SMTP throws ──────────────────────────────────────────────────────────────

describe('sendEmail — transport error', () => {
  beforeEach(() => {
    process.env.SMTP_HOST = 'smtp.resend.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'resend';
    process.env.SMTP_PASS = 're_testkey123';
    mockTransport.sendMail.mockRejectedValueOnce(new Error('ECONNREFUSED'));
  });
  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  test('returns sent: false on transport error', async () => {
    const result = await sendEmail(validPayload);
    expect(result.sent).toBe(false);
  });
  test('does not throw — error is caught', async () => {
    await expect(sendEmail(validPayload)).resolves.not.toThrow();
  });
  test('returns reason containing error message', async () => {
    const result = await sendEmail(validPayload);
    expect(result.reason).toContain('ECONNREFUSED');
  });
});
