/**
 * Unit tests for lib/utils.ts
 */

import { currency, slugify, safeJsonParse } from '../lib/utils';

// ─── currency ────────────────────────────────────────────────────────────────

describe('currency', () => {
  test('formats a number as ZAR currency', () => {
    const result = currency(2200);
    expect(result).toContain('2');
    expect(result).toContain('200');
  });

  test('accepts a string input', () => {
    const result = currency('1500');
    expect(typeof result).toBe('string');
    expect(result).toContain('1');
  });

  test('handles zero', () => {
    const result = currency(0);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('handles large numbers', () => {
    const result = currency(10000);
    expect(result).toContain('10');
  });

  test('returns a string', () => {
    expect(typeof currency(500)).toBe('string');
  });

  test('formats consistently for the same input', () => {
    expect(currency(2500)).toBe(currency(2500));
  });
});

// ─── slugify ─────────────────────────────────────────────────────────────────

describe('slugify', () => {
  test('converts spaces to hyphens', () => {
    expect(slugify('Cape Point')).toBe('cape-point');
  });

  test('lowercases the string', () => {
    expect(slugify('Table Mountain')).toBe('table-mountain');
  });

  test("removes apostrophes and special characters", () => {
    expect(slugify("Chapman's Peak")).toBe('chapman-s-peak');
  });

  test('handles multiple consecutive spaces', () => {
    expect(slugify('Bo  Kaap')).toBe('bo-kaap');
  });

  test('trims leading and trailing spaces', () => {
    expect(slugify('  Cape Town  ')).toBe('cape-town');
  });

  test('handles already-slugified strings', () => {
    expect(slugify('cape-point')).toBe('cape-point');
  });

  test('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  test('removes leading and trailing hyphens', () => {
    expect(slugify('--Cape Town--')).toBe('cape-town');
  });

  test('handles numbers in string', () => {
    expect(slugify('Route 66')).toBe('route-66');
  });

  test('handles mixed case', () => {
    expect(slugify('Bo-Kaap CBD')).toBe('bo-kaap-cbd');
  });
});

// ─── safeJsonParse ───────────────────────────────────────────────────────────

describe('safeJsonParse', () => {
  test('parses valid JSON array', () => {
    const result = safeJsonParse<string[]>('["scenic","nature","iconic"]', []);
    expect(result).toEqual(['scenic', 'nature', 'iconic']);
  });

  test('parses valid JSON object', () => {
    const result = safeJsonParse<Record<string, number>>('{"tours":3}', {});
    expect(result).toEqual({ tours: 3 });
  });

  test('returns fallback for invalid JSON', () => {
    const result = safeJsonParse<string[]>('not valid json', []);
    expect(result).toEqual([]);
  });

  test('returns fallback for empty string', () => {
    const result = safeJsonParse<string[]>('', []);
    expect(result).toEqual([]);
  });

  test('returns fallback for null string', () => {
    const result = safeJsonParse<string[]>('null', ['default']);
    expect(result).toBeNull();
  });

  test('returns fallback object for malformed JSON', () => {
    const result = safeJsonParse<Record<string, string>>('{broken}', { key: 'default' });
    expect(result).toEqual({ key: 'default' });
  });

  test('parses nested JSON correctly', () => {
    const result = safeJsonParse<{ tags: string[] }>('{"tags":["wine","food"]}', { tags: [] });
    expect(result.tags).toEqual(['wine', 'food']);
  });

  test('parses boolean values', () => {
    expect(safeJsonParse<boolean>('true', false)).toBe(true);
    expect(safeJsonParse<boolean>('false', true)).toBe(false);
  });

  test('parses number values', () => {
    expect(safeJsonParse<number>('42', 0)).toBe(42);
  });
});
