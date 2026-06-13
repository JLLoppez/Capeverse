/**
 * Unit tests — lib/env.ts
 * Covers: validateEnv, required vars, optional vars, secret length guard
 */

// Reset modules between tests so we can re-import with different env vars
beforeEach(() => {
  jest.resetModules();
  // Set all required vars as a baseline
  process.env.DATABASE_URL         = 'postgresql://test:test@localhost/test';
  process.env.ADMIN_SESSION_SECRET = 'a-32-char-secret-for-testing-ok!';
  process.env.ADMIN_EMAIL          = 'admin@capeverse.co.za';
  process.env.ADMIN_PASSWORD       = 'strongpassword123';
});

afterEach(() => {
  delete process.env.DATABASE_URL;
  delete process.env.ADMIN_SESSION_SECRET;
  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;
});

describe('validateEnv — required vars present', () => {
  test('does not throw when all required vars set', async () => {
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).not.toThrow();
  });
});

describe('validateEnv — missing required vars', () => {
  test('throws when DATABASE_URL missing', async () => {
    delete process.env.DATABASE_URL;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).toThrow();
  });
  test('throws when ADMIN_SESSION_SECRET missing', async () => {
    delete process.env.ADMIN_SESSION_SECRET;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).toThrow();
  });
  test('throws when ADMIN_EMAIL missing', async () => {
    delete process.env.ADMIN_EMAIL;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).toThrow();
  });
  test('throws when ADMIN_PASSWORD missing', async () => {
    delete process.env.ADMIN_PASSWORD;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).toThrow();
  });
  test('error message contains variable name', async () => {
    delete process.env.DATABASE_URL;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).toThrow(/DATABASE_URL/);
  });
  test('throws when multiple required vars missing', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.ADMIN_EMAIL;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).toThrow();
  });
});

describe('validateEnv — session secret length guard', () => {
  test('throws when secret is 31 chars (under minimum)', async () => {
    process.env.ADMIN_SESSION_SECRET = 'a'.repeat(31);
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).toThrow(/32/);
  });
  test('accepts secret of exactly 32 chars', async () => {
    process.env.ADMIN_SESSION_SECRET = 'a'.repeat(32);
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).not.toThrow();
  });
  test('accepts secret of 64 chars', async () => {
    process.env.ADMIN_SESSION_SECRET = 'a'.repeat(64);
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).not.toThrow();
  });
});

describe('validateEnv — optional vars', () => {
  test('does not throw when OPENAI_API_KEY missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).not.toThrow();
  });
  test('does not throw when SMTP_HOST missing', async () => {
    delete process.env.SMTP_HOST;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).not.toThrow();
  });
  test('does not throw when STRIPE_SECRET_KEY missing', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { validateEnv } = await import('../lib/env');
    expect(() => validateEnv()).not.toThrow();
  });
});
