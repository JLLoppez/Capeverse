import { NextResponse, NextRequest } from 'next/server';

// middleware runs for all /admin routes
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Replace this with your real auth check later
 const token = req.cookies.get('admin-session')?.value;
const isLoggedIn = !!token;

  // Allow login page so it does NOT redirect to itself
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Protect all other /admin routes
  if (pathname.startsWith('/admin') && !isLoggedIn) {
    // Use environment variable for production, fallback to localhost
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${siteUrl}/admin/login`);
  }

  return NextResponse.next();
}

// Only run this middleware for /admin routes
export const config = {
  matcher: ['/admin/:path*'],
};
