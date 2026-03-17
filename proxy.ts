import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'cape_admin_session';

async function verifyToken(token: string, secret: string): Promise<boolean> {
  try {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return false;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from(
      signature.match(/.{1,2}/g)!.map((b) => parseInt(b, 16))
    );
    const data = new TextEncoder().encode(encoded);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!valid) return false;
    const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    return payload.scope === 'admin' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/admin/login'
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const secret = process.env.ADMIN_SESSION_SECRET || '';
    if (!token || !await verifyToken(token, secret)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
