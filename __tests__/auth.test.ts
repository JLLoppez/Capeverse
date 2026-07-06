/**
 * Unit tests — lib/auth.ts
 * Covers: createAdminToken, verifyAdminToken
 * All edge cases including tamper, expiry, wrong scope, missing secret
 */

process.env.ADMIN_SESSION_SECRET = 'test-secret-key-for-unit-testing-minimum32';

import { createAdminToken, verifyAdminToken } from '../lib/auth';
const crypto = require('crypto');

// ─── createAdminToken ─────────────────────────────────────────────────────────

describe('createAdminToken', () => {
  test('returns a string',                    () => expect(typeof createAdminToken()).toBe('string'));
  test('contains exactly one dot separator',  () => expect(createAdminToken().split('.').length).toBe(2));
  test('payload part is non-empty',           () => expect(createAdminToken().split('.')[0].length).toBeGreaterThan(0));
  test('signature part is non-empty',         () => expect(createAdminToken().split('.')[1].length).toBeGreaterThan(0));
  test('two tokens created are different',    () => expect(createAdminToken()).not.toBe(createAdminToken()));

  test('payload decodes to valid admin scope', () => {
    const [encoded] = createAdminToken().split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    expect(payload.scope).toBe('admin');
  });
  test('payload exp is in the future', () => {
    const [encoded] = createAdminToken().split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    expect(payload.exp).toBeGreaterThan(Date.now());
  });
  test('payload exp is approximately 7 days from now', () => {
    const [encoded] = createAdminToken().split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(payload.exp).toBeGreaterThan(Date.now() + sevenDays - 5000);
    expect(payload.exp).toBeLessThan(Date.now() + sevenDays + 5000);
  });
});

// ─── verifyAdminToken ─────────────────────────────────────────────────────────

describe('verifyAdminToken — valid tokens', () => {
  test('verifies a freshly created token',     () => expect(verifyAdminToken(createAdminToken())).toBe(true));
  test('verifies token twice consistently',    () => {
    const t = createAdminToken();
    expect(verifyAdminToken(t)).toBe(true);
    expect(verifyAdminToken(t)).toBe(true);
  });
});

describe('verifyAdminToken — null / empty / garbage', () => {
  test('rejects null',            () => expect(verifyAdminToken(null)).toBe(false));
  test('rejects undefined',       () => expect(verifyAdminToken(undefined)).toBe(false));
  test('rejects empty string',    () => expect(verifyAdminToken('')).toBe(false));
  test('rejects whitespace',      () => expect(verifyAdminToken('   ')).toBe(false));
  test('rejects random string',   () => expect(verifyAdminToken('not-a-token')).toBe(false));
  test('rejects single dot',      () => expect(verifyAdminToken('.')).toBe(false));
  test('rejects no dots',         () => expect(verifyAdminToken('nodothere')).toBe(false));
  test('rejects three-part token',() => expect(verifyAdminToken('a.b.c')).toBe(false));
});

describe('verifyAdminToken — tampered tokens', () => {
  test('rejects tampered payload', () => {
    const [, sig] = createAdminToken().split('.');
    const tampered = Buffer.from(JSON.stringify({ exp: Date.now() + 9999999, scope: 'admin' })).toString('base64url');
    expect(verifyAdminToken(`${tampered}.${sig}`)).toBe(false);
  });
  test('rejects tampered signature', () => {
    const [payload] = createAdminToken().split('.');
    expect(verifyAdminToken(`${payload}.invalidsignaturestring`)).toBe(false);
  });
  test('rejects wrong scope: superadmin', () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 9999999, scope: 'superadmin' })).toString('base64url');
    expect(verifyAdminToken(`${payload}.fakesig`)).toBe(false);
  });
  test('rejects wrong scope: user', () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 9999999, scope: 'user' })).toString('base64url');
    expect(verifyAdminToken(`${payload}.fakesig`)).toBe(false);
  });
  test('rejects missing scope field', () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 9999999 })).toString('base64url');
    expect(verifyAdminToken(`${payload}.fakesig`)).toBe(false);
  });
});

describe('verifyAdminToken — expired tokens', () => {
  test('rejects expired token', () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() - 1000, scope: 'admin' })).toString('base64url');
    const sig = crypto.createHmac('sha256', 'test-secret-key-for-unit-testing-minimum32').update(payload).digest('hex');
    expect(verifyAdminToken(`${payload}.${sig}`)).toBe(false);
  });
  test('rejects token that expires exactly now', () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now(), scope: 'admin' })).toString('base64url');
    const sig = crypto.createHmac('sha256', 'test-secret-key-for-unit-testing-minimum32').update(payload).digest('hex');
    expect(verifyAdminToken(`${payload}.${sig}`)).toBe(false);
  });
  test('accepts token expiring in the far future', () => {
    const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 9999999999, scope: 'admin' })).toString('base64url');
    const sig = crypto.createHmac('sha256', 'test-secret-key-for-unit-testing-minimum32').update(payload).digest('hex');
    expect(verifyAdminToken(`${payload}.${sig}`)).toBe(true);
  });
});
