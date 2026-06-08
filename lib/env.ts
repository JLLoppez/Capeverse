/**
 * Validates required environment variables at startup.
 * Import this at the top of `instrumentation.ts` so it runs before any request.
 * Missing critical vars will throw immediately, making the deploy fail visibly
 * rather than silently at runtime.
 */

type EnvVar = {
  key: string;
  required: boolean;
  description: string;
};

const ENV_VARS: EnvVar[] = [
  { key: 'DATABASE_URL',           required: true,  description: 'PostgreSQL connection string' },
  { key: 'ADMIN_SESSION_SECRET',   required: true,  description: 'Min 32-char secret for admin sessions' },
  { key: 'OPENAI_API_KEY',         required: false, description: 'OpenAI key — AI features disabled without it' },
  { key: 'STRIPE_SECRET_KEY',      required: false, description: 'Stripe secret — bookings disabled without it' },
  { key: 'CRON_SECRET',            required: false, description: 'Protects /api/cron/* endpoints' },
  { key: 'NEXT_PUBLIC_BASE_URL',   required: false, description: 'Full domain for review email links' },
  { key: 'SMTP_HOST',              required: false, description: 'SMTP config — emails disabled without it' },
];

export function validateEnv(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const { key, required, description } of ENV_VARS) {
    const value = process.env[key];
    if (!value) {
      if (required) {
        missing.push(`  ❌ ${key} — ${description}`);
      } else {
        warnings.push(`  ⚠  ${key} — ${description}`);
      }
    }
  }

  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn('[env] Optional env vars not set (features degraded):\n' + warnings.join('\n'));
  }

  if (missing.length > 0) {
    throw new Error(
      '[env] Missing required environment variables — cannot start:\n' + missing.join('\n')
    );
  }

  // Extra: warn if ADMIN_SESSION_SECRET is too short
  const secret = process.env.ADMIN_SESSION_SECRET ?? '';
  if (secret.length < 32) {
    throw new Error('[env] ADMIN_SESSION_SECRET must be at least 32 characters long');
  }
}
