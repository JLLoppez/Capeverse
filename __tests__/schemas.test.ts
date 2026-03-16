/**
 * Unit tests for lib/schemas.ts
 * Tests all Zod validation schemas
 */

import { EnquirySchema, ItineraryGenerateSchema, AIGenerateSchema } from '../lib/schemas';

// ─── EnquirySchema ───────────────────────────────────────────────────────────

describe('EnquirySchema', () => {
  const validBase = {
    fullName: 'Jose Lopes',
    email: 'jose@example.com',
    phone: null,
    nationality: null,
    travelDate: null,
    groupSize: null,
    budgetRange: null,
    tripLengthDays: null,
    message: null
  };

  test('accepts valid minimal input', () => {
    const result = EnquirySchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  test('accepts full valid input', () => {
    const result = EnquirySchema.safeParse({
      ...validBase,
      phone: '+27761234567',
      nationality: 'South African',
      travelDate: '2026-06-15',
      groupSize: '4',
      budgetRange: 'Luxury',
      tripLengthDays: '7',
      message: 'We want to see penguins and do wine tasting.'
    });
    expect(result.success).toBe(true);
  });

  test('rejects missing fullName', () => {
    const result = EnquirySchema.safeParse({ ...validBase, fullName: '' });
    expect(result.success).toBe(false);
  });

  test('rejects fullName too short', () => {
    const result = EnquirySchema.safeParse({ ...validBase, fullName: 'A' });
    expect(result.success).toBe(false);
  });

  test('rejects invalid email', () => {
    const result = EnquirySchema.safeParse({ ...validBase, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  test('rejects empty email', () => {
    const result = EnquirySchema.safeParse({ ...validBase, email: '' });
    expect(result.success).toBe(false);
  });

  test('transforms travelDate string to Date object', () => {
    const result = EnquirySchema.safeParse({ ...validBase, travelDate: '2026-06-15' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.travelDate).toBeInstanceOf(Date);
    }
  });

  test('transforms groupSize string to number', () => {
    const result = EnquirySchema.safeParse({ ...validBase, groupSize: '4' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.groupSize).toBe(4);
    }
  });

  test('rejects groupSize of zero', () => {
    const result = EnquirySchema.safeParse({ ...validBase, groupSize: '0' });
    expect(result.success).toBe(false);
  });

  test('rejects negative groupSize', () => {
    const result = EnquirySchema.safeParse({ ...validBase, groupSize: '-1' });
    expect(result.success).toBe(false);
  });

  test('rejects groupSize over 500', () => {
    const result = EnquirySchema.safeParse({ ...validBase, groupSize: '501' });
    expect(result.success).toBe(false);
  });

  test('transforms tripLengthDays string to number', () => {
    const result = EnquirySchema.safeParse({ ...validBase, tripLengthDays: '7' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tripLengthDays).toBe(7);
    }
  });

  test('rejects tripLengthDays over 90', () => {
    const result = EnquirySchema.safeParse({ ...validBase, tripLengthDays: '91' });
    expect(result.success).toBe(false);
  });

  test('rejects message over 2000 characters', () => {
    const result = EnquirySchema.safeParse({ ...validBase, message: 'a'.repeat(2001) });
    expect(result.success).toBe(false);
  });

  test('accepts null for all optional fields', () => {
    const result = EnquirySchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeNull();
      expect(result.data.travelDate).toBeNull();
      expect(result.data.groupSize).toBeNull();
    }
  });
});

// ─── ItineraryGenerateSchema ─────────────────────────────────────────────────

describe('ItineraryGenerateSchema', () => {
  const validInput = {
    attractionIds: ['clh1234567890abcdefghijk', 'clh9876543210zyxwvutsrq'],
    days: 3,
    budget: 'Mid-range' as const,
    pace: 'Balanced' as const,
    groupType: 'Couple'
  };

  test('accepts valid input', () => {
    const result = ItineraryGenerateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('rejects empty attractionIds array', () => {
    const result = ItineraryGenerateSchema.safeParse({ ...validInput, attractionIds: [] });
    expect(result.success).toBe(false);
  });

  test('rejects days of 0', () => {
    const result = ItineraryGenerateSchema.safeParse({ ...validInput, days: 0 });
    expect(result.success).toBe(false);
  });

  test('rejects days over 14', () => {
    const result = ItineraryGenerateSchema.safeParse({ ...validInput, days: 15 });
    expect(result.success).toBe(false);
  });

  test('rejects invalid budget', () => {
    const result = ItineraryGenerateSchema.safeParse({ ...validInput, budget: 'Ultra' });
    expect(result.success).toBe(false);
  });

  test('rejects invalid pace', () => {
    const result = ItineraryGenerateSchema.safeParse({ ...validInput, pace: 'Turbo' });
    expect(result.success).toBe(false);
  });

  test('accepts all valid budget options', () => {
    const budgets = ['Budget', 'Mid-range', 'Premium', 'Luxury'];
    budgets.forEach((budget) => {
      const result = ItineraryGenerateSchema.safeParse({ ...validInput, budget });
      expect(result.success).toBe(true);
    });
  });

  test('accepts all valid pace options', () => {
    const paces = ['Relaxed', 'Balanced', 'Packed'];
    paces.forEach((pace) => {
      const result = ItineraryGenerateSchema.safeParse({ ...validInput, pace });
      expect(result.success).toBe(true);
    });
  });

  test('defaults budget to Mid-range when not provided', () => {
    const { budget, ...rest } = validInput;
    const result = ItineraryGenerateSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budget).toBe('Mid-range');
    }
  });

  test('defaults pace to Balanced when not provided', () => {
    const { pace, ...rest } = validInput;
    const result = ItineraryGenerateSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pace).toBe('Balanced');
    }
  });

  test('rejects more than 30 attraction IDs', () => {
    const result = ItineraryGenerateSchema.safeParse({
      ...validInput,
      attractionIds: Array.from({ length: 31 }, (_, i) => `clh${i}abc`)
    });
    expect(result.success).toBe(false);
  });
});

// ─── AIGenerateSchema ─────────────────────────────────────────────────────────

describe('AIGenerateSchema', () => {
  const validInput = {
    days: 3,
    groupType: 'Couple',
    budget: 'Mid-range',
    pace: 'Balanced',
    interests: ['scenic', 'wine'],
    mustSee: ['cape-point']
  };

  test('accepts valid input', () => {
    const result = AIGenerateSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  test('accepts input without mustSee', () => {
    const { mustSee, ...rest } = validInput;
    const result = AIGenerateSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  test('rejects empty interests', () => {
    const result = AIGenerateSchema.safeParse({ ...validInput, interests: [] });
    expect(result.success).toBe(false);
  });

  test('rejects more than 10 interests', () => {
    const result = AIGenerateSchema.safeParse({
      ...validInput,
      interests: Array.from({ length: 11 }, (_, i) => `interest${i}`)
    });
    expect(result.success).toBe(false);
  });

  test('rejects days of 0', () => {
    const result = AIGenerateSchema.safeParse({ ...validInput, days: 0 });
    expect(result.success).toBe(false);
  });

  test('rejects days over 14', () => {
    const result = AIGenerateSchema.safeParse({ ...validInput, days: 15 });
    expect(result.success).toBe(false);
  });
});
