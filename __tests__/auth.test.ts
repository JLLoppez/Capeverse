/**
 * Unit tests for lib/auth.ts
 * Tests token creation and verification
 */

process.env.ADMIN_SESSION_SECRET = 'test-secret-key-for-unit-testing-32chars';

import { createAdminToken, verifyAdminToken } from '../lib/auth';

describe('createAdminToken', () => {
  test('returns a string', () => {
    expect(typeof createAdminToken()).toBe('string');
  });

  test('contains a dot separator between payload and signature', () => {
    const token = createAdminToken();
    expect(token.split('.').length).toBe(2);
  });

  test('creates a token with two parts separated by a dot', () => {
    const token = createAdminToken();
    const parts = token.split('.');
    expect(parts.length).toBe(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  test('token payload decodes to valid admin scope', () => {
    const token = createAdminToken();
    const [encoded] = token.split('.');
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    expect(payload.scope).toBe('admin');
    expect(payload.exp).toBeGreaterThan(Date.now());
  });
});

describe('verifyAdminToken', () => {
  test('verifies a freshly created token', () => {
    const token = createAdminToken();
    expect(verifyAdminToken(token)).toBe(true);
  });

  test('rejects null', () => {
    expect(verifyAdminToken(null)).toBe(false);
  });

  test('rejects undefined', () => {
    expect(verifyAdminToken(undefined)).toBe(false);
  });

  test('rejects empty string', () => {
    expect(verifyAdminToken('')).toBe(false);
  });

  test('rejects a random string', () => {
    expect(verifyAdminToken('not-a-valid-token')).toBe(false);
  });

  test('rejects a tampered payload', () => {
    const token = createAdminToken();
    const [payload, sig] = token.split('.');
    const tampered = Buffer.from(
      JSON.stringify({ exp: Date.now() + 999999999, scope: 'admin' })
    ).toString('base64url');
    expect(verifyAdminToken(`${tampered}.${sig}`)).toBe(false);
  });

  test('rejects a tampered signature', () => {
    const token = createAdminToken();
    const [payload] = token.split('.');
    expect(verifyAdminToken(`${payload}.invalidsignature`)).toBe(false);
  });

  test('rejects a token with wrong scope', () => {
    const payload = Buffer.from(
      JSON.stringify({ exp: Date.now() + 99999999, scope: 'superadmin' })
    ).toString('base64url');
    expect(verifyAdminToken(`${payload}.fakesig`)).toBe(false);
  });

  test('rejects an expired token', () => {
    const payload = Buffer.from(
      JSON.stringify({ exp: Date.now() - 1000, scope: 'admin' })
    ).toString('base64url');
    const crypto = require('crypto');
    const sig = crypto
      .createHmac('sha256', 'test-secret-key-for-unit-testing-32chars')
      .update(payload)
      .digest('hex');
    expect(verifyAdminToken(`${payload}.${sig}`)).toBe(false);
  });
});
