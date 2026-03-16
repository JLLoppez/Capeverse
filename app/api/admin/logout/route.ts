import { NextResponse } from 'next/server';
import { getAdminCookieName } from '@/lib/auth';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/admin/login', request.url), 303);
  response.cookies.set(getAdminCookieName(), '', { path: '/', maxAge: 0 });
  return response;
}
