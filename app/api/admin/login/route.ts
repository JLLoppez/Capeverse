import { NextResponse } from 'next/server';
import { createAdminToken, getAdminCookieName } from '@/lib/auth';
import { checkRateLimit, resetRateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  const { allowed, retryAfterMs } = checkRateLimit(request);

  if (!allowed) {
    const retryAfterSecs = Math.ceil(retryAfterMs / 1000);
    return NextResponse.redirect(
      new URL(`/admin/login?error=too-many-attempts&retry=${retryAfterSecs}`, request.url),
      303
    );
  }

  const formData = await request.formData();
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');

  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.redirect(new URL('/admin/login?error=1', request.url), 303);
  }

  // Successful login — clear rate limit bucket for this IP
  resetRateLimit(request);

  const response = NextResponse.redirect(new URL('/admin', request.url), 303);
  response.cookies.set(getAdminCookieName(), createAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  return response;
}
