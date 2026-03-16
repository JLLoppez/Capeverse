/**
 * Unit tests for lib/mail.ts
 * Tests email template generation
 */

import {
  enquiryReceivedAdminTemplate,
  enquiryReceivedCustomerTemplate,
  enquiryStatusTemplate
} from '../lib/mail';

// ─── enquiryReceivedAdminTemplate ────────────────────────────────────────────

describe('enquiryReceivedAdminTemplate', () => {
  const baseData = {
    fullName: 'Jose Lopes',
    email: 'jose@example.com',
    phone: '+27761234567',
    travelDate: new Date('2026-06-15'),
    groupSize: 4,
    budgetRange: 'Luxury',
    tripLengthDays: 7,
    nationality: 'South African',
    message: 'We want penguins and wine tasting.'
  };

  test('returns subject containing the full name', () => {
    const { subject } = enquiryReceivedAdminTemplate(baseData);
    expect(subject).toContain('Jose Lopes');
  });

  test('returns non-empty HTML', () => {
    const { html } = enquiryReceivedAdminTemplate(baseData);
    expect(html.length).toBeGreaterThan(50);
  });

  test('HTML contains the email address', () => {
    const { html } = enquiryReceivedAdminTemplate(baseData);
    expect(html).toContain('jose@example.com');
  });

  test('HTML contains the phone number', () => {
    const { html } = enquiryReceivedAdminTemplate(baseData);
    expect(html).toContain('+27761234567');
  });

  test('HTML contains the message', () => {
    const { html } = enquiryReceivedAdminTemplate(baseData);
    expect(html).toContain('penguins and wine tasting');
  });

  test('handles null optional fields gracefully', () => {
    const result = enquiryReceivedAdminTemplate({
      fullName: 'Test User',
      email: 'test@example.com',
      phone: null,
      travelDate: null,
      groupSize: null,
      budgetRange: null,
      tripLengthDays: null,
      nationality: null,
      message: null
    });
    expect(result.html).toContain('Not provided');
    expect(result.html).toContain('No message supplied');
  });

  test('returns plain text version', () => {
    const { text } = enquiryReceivedAdminTemplate(baseData);
    expect(text).toContain('Jose Lopes');
    expect(text).toContain('jose@example.com');
  });
});

// ─── enquiryReceivedCustomerTemplate ─────────────────────────────────────────

describe('enquiryReceivedCustomerTemplate', () => {
  test('returns correct subject', () => {
    const { subject } = enquiryReceivedCustomerTemplate({ fullName: 'Jose' });
    expect(subject).toContain('Cape');
  });

  test('HTML contains the traveller name', () => {
    const { html } = enquiryReceivedCustomerTemplate({ fullName: 'Jose Lopes' });
    expect(html).toContain('Jose Lopes');
  });

  test('returns non-empty HTML', () => {
    const { html } = enquiryReceivedCustomerTemplate({ fullName: 'Jose' });
    expect(html.length).toBeGreaterThan(50);
  });

  test('returns plain text version', () => {
    const { text } = enquiryReceivedCustomerTemplate({ fullName: 'Jose Lopes' });
    expect(text).toContain('Jose Lopes');
  });
});

// ─── enquiryStatusTemplate ───────────────────────────────────────────────────

describe('enquiryStatusTemplate', () => {
  test('subject contains the status', () => {
    const { subject } = enquiryStatusTemplate({ fullName: 'Jose', status: 'Confirmed', notes: null });
    expect(subject).toContain('Confirmed');
  });

  test('HTML contains the traveller name', () => {
    const { html } = enquiryStatusTemplate({ fullName: 'Jose Lopes', status: 'Confirmed', notes: null });
    expect(html).toContain('Jose Lopes');
  });

  test('HTML contains the status', () => {
    const { html } = enquiryStatusTemplate({ fullName: 'Jose', status: 'In Progress', notes: null });
    expect(html).toContain('In Progress');
  });

  test('HTML contains notes when provided', () => {
    const { html } = enquiryStatusTemplate({ fullName: 'Jose', status: 'Confirmed', notes: 'Your driver will be John.' });
    expect(html).toContain('Your driver will be John.');
  });

  test('HTML does not contain notes section when notes is null', () => {
    const { html } = enquiryStatusTemplate({ fullName: 'Jose', status: 'Confirmed', notes: null });
    expect(html).not.toContain('Notes from our team');
  });

  test('returns plain text version', () => {
    const { text } = enquiryStatusTemplate({ fullName: 'Jose', status: 'Confirmed', notes: 'All good.' });
    expect(text).toContain('Confirmed');
    expect(text).toContain('All good.');
  });
});
