import { validateEnv } from '@/lib/env';

export async function register() {
  // Validate env vars at startup — throws if critical vars are missing
  validateEnv();
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: Sentry } = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { default: Sentry } = await import('@sentry/nextjs');
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0,
      enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    });
  }
}
