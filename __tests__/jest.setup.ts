/**
 * Jest global setup — runs before every test file
 * Sets safe baseline env vars and patches globals that Next.js needs
 */

// Next.js server-side globals
if (typeof crypto === 'undefined') {
  const { webcrypto } = require('crypto');
  (global as any).crypto = webcrypto;
}

// Baseline env
process.env.NODE_ENV             = 'test';
process.env.DATABASE_URL         = 'postgresql://test:test@localhost/test_capeverse';
process.env.ADMIN_SESSION_SECRET = 'test-secret-for-jest-min-32-chars!!';
process.env.ADMIN_EMAIL          = 'admin@test.com';
process.env.ADMIN_PASSWORD       = 'testpassword123';
process.env.NEXT_PUBLIC_BASE_URL = 'https://test.capeverse.co.za';
