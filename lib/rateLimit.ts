/**
 * Simple in-memory rate limiter for admin login attempts.
 * Works per-process; for multi-instance deploys, swap backing store to Redis.
 * Limits: max 5 attempts per IP per 15-minute window.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

type Entry = { count: number; windowStart: number };
const store = new Map<string, Entry>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export function checkRateLimit(request: Request): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, retryAfterMs: 0 };
}

export function resetRateLimit(request: Request) {
  const ip = getClientIp(request);
  store.delete(ip);
}
