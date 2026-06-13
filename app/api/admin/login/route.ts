import { NextResponse }                      from 'next/server';
import { createHash }                        from 'crypto';
import { prisma }                            from '@/lib/prisma';
import { createAdminToken, getAdminCookieName } from '@/lib/auth';
import { checkRateLimit, resetRateLimit }    from '@/lib/rateLimit';

export async function POST(request: Request) {
  // ── Rate limit: 5 attempts per 15 minutes per IP ────────────────────────
  const { allowed, retryAfterMs } = checkRateLimit(request, 'admin_login');
  if (!allowed) {
    const retrySecs = Math.ceil(retryAfterMs / 1000);
    return NextResponse.redirect(
      new URL(`/admin/login?error=too-many-attempts&retry=${retrySecs}`, request.url),
      303
    );
  }

  let email: string, password: string;
  try {
    const fd = await request.formData();
    email    = String(fd.get('email')    || '').trim();
    password = String(fd.get('password') || '');
  } catch {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url), 303);
  }

  if (!email || !password) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url), 303);
  }

  // ── Primary: validate against DB-hashed credentials (set via /api/admin/setup) ─
  let authenticated = false;

  try {
    const record = await prisma.adminSetup.findUnique({ where: { id: 'singleton' } });
    if (record && record.email === email) {
      const [salt, storedHash] = record.passwordHash.split(':');
      if (salt && storedHash) {
        const hash = createHash('sha256').update(salt + password).digest('hex');
        authenticated = hash === storedHash;
      }
    }
  } catch {
    // DB unavailable — fall through to env-var fallback
  }

  // ── Fallback: env-var credentials for initial deploy before /setup is called ──
  if (!authenticated) {
    const envEmail    = process.env.ADMIN_EMAIL    ?? '';
    const envPassword = process.env.ADMIN_PASSWORD ?? '';
    if (envEmail && envPassword && email === envEmail && password === envPassword) {
      authenticated = true;
    }
  }

  if (!authenticated) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url), 303);
  }

  // ── Success ────────────────────────────────────────────────────────────────
  resetRateLimit(request, 'admin_login');

  const response = NextResponse.redirect(new URL('/admin', request.url), 303);
  response.cookies.set(getAdminCookieName(), createAdminToken(), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  });
  return response;
}
