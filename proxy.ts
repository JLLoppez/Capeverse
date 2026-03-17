
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bypass proxy for static files, API routes, and login page
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/public") ||
    pathname === "/admin/login"
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token = req.cookies.get("adminToken"); // replace with your cookie name

  // Redirect unauthenticated users to login
  if (!token && pathname.startsWith("/admin")) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Everything else is fine
  return NextResponse.next();
}
