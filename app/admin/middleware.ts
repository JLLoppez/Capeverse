import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // 🔑 simulate auth (replace later)
  const isLoggedIn = false;

  // ✅ allow login page (CRITICAL FIX)
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 🔒 protect admin routes
  if (pathname.startsWith('/admin') && !isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
}
