/**
 * Multi-tier rate limiter covering all public and admin routes.
 * Swap `store` for a Redis client in multi-instance deploys.
 */
import { NextResponse } from 'next/server';

type Entry = { count: number; windowStart: number };
const store = new Map<string, Entry>();

export type RateLimitTier = 'admin_login' | 'enquiry' | 'ai_chat' | 'itinerary' | 'public';

const TIERS: Record<RateLimitTier, { windowMs: number; max: number }> = {
  admin_login: { windowMs: 15 * 60 * 1000, max: 5 },
  enquiry:     { windowMs: 60 * 60 * 1000, max: 10 },
  ai_chat:     { windowMs: 60 * 1000,       max: 20 },
  itinerary:   { windowMs: 60 * 1000,       max: 15 },
  public:      { windowMs: 60 * 1000,       max: 60 },
};

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

export function checkRateLimit(
  request: Request,
  tier: RateLimitTier = 'public'
): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const { windowMs, max } = TIERS[tier];
  const ip = getClientIp(request);
  const key = `${tier}:${ip}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }

  if (entry.count >= max) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.count += 1;
  return { allowed: true, remaining: max - entry.count, retryAfterMs: 0 };
}

export function resetRateLimit(request: Request, tier: RateLimitTier = 'public') {
  const ip = getClientIp(request);
  store.delete(`${tier}:${ip}`);
}

export function rateLimitResponse(
  request: Request,
  tier: RateLimitTier = 'public'
): NextResponse | null {
  const result = checkRateLimit(request, tier);
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(result.retryAfterMs / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }
  return null;
}
