import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

const ADMIN_UI_PREFIX  = '/admin';
const ADMIN_API_PREFIX = '/api/admin';
const LOGIN_PATH       = '/admin/login';
const SETUP_PATH       = '/admin/setup';
const CRON_PREFIX      = '/api/cron';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Cron routes: require CRON_SECRET bearer token ───────────────────────
  if (pathname.startsWith(CRON_PREFIX)) {
    const auth = request.headers.get('authorization');
    const expected = `Bearer ${process.env.CRON_SECRET}`;
    if (!process.env.CRON_SECRET || auth !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Admin API routes ──────────────────────────────────────────────────────
  if (pathname.startsWith(ADMIN_API_PREFIX)) {
    const token = request.cookies.get('cape_admin_session')?.value;
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ── Admin UI routes (skip login and setup pages) ─────────────────────────
  if (
    pathname.startsWith(ADMIN_UI_PREFIX) &&
    !pathname.startsWith(LOGIN_PATH) &&
    !pathname.startsWith(SETUP_PATH)
  ) {
    const token = request.cookies.get('cape_admin_session')?.value;
    if (!verifyAdminToken(token)) {
      const loginUrl = new URL(LOGIN_PATH, request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/cron/:path*'],
};
