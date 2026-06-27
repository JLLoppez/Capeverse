import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * First-run setup endpoint.
 * Fix 5: Guards against being called repeatedly to overwrite credentials.
 * Checks the DB (not just an env var) to determine if setup is already done.
 * Returns 410 Gone permanently once an admin account exists.
 */
export async function POST(request: Request) {
  // Fix 5: Check DB directly — env var ADMIN_PASSWORD_HASH was never actually
  // set anywhere, so the old guard was always bypassed.
  const existing = await prisma.adminSetup.findUnique({ where: { id: 'singleton' } });
  if (existing) {
    return NextResponse.json(
      { error: 'Setup already completed. This endpoint is disabled.' },
      { status: 410 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 422 });
  }

  if (!password || password.length < 12) {
    return NextResponse.json(
      { error: 'Password must be at least 12 characters' },
      { status: 422 }
    );
  }

  const salt = crypto.randomUUID();
  const hash = createHash('sha256').update(salt + password).digest('hex');

  // Use create (not upsert) — if a race condition hits, the unique constraint
  // on id:'singleton' will throw rather than silently overwriting credentials.
  await prisma.adminSetup.create({
    data: { id: 'singleton', email, passwordHash: `${salt}:${hash}`, completedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    message: 'Admin account configured. You can now log in at /admin/login.',
  });
}
