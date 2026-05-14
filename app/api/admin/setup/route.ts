import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * First-run setup endpoint.
 * Only works when no admin credentials are configured yet (ADMIN_PASSWORD_HASH is unset).
 * Call once after deploy; returns 410 Gone on subsequent calls.
 */
export async function POST(request: Request) {
  // If already configured, permanently refuse
  if (process.env.ADMIN_PASSWORD_HASH) {
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

  // Hash with SHA-256 + salt (in production use bcrypt/argon2)
  const salt = crypto.randomUUID();
  const hash = createHash('sha256')
    .update(salt + password)
    .digest('hex');

  // Store setup completion marker in DB so it persists across restarts
  await prisma.adminSetup.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', email, passwordHash: `${salt}:${hash}`, completedAt: new Date() },
    update: { email, passwordHash: `${salt}:${hash}`, completedAt: new Date() }
  });

  return NextResponse.json({
    success: true,
    message: 'Admin account configured. You can now log in at /admin/login.'
  });
}
