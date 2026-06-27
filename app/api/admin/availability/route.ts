import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';
import { z } from 'zod';

const BlockSchema = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  maxGroups: z.number().int().min(0).default(0),
  note:      z.string().max(200).optional(),
});

// Fix 4: All three methods now require admin authentication
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const from = new Date();
  const to   = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const rows = await prisma.operatorAvailability.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  let parsed: z.infer<typeof BlockSchema>;
  try { parsed = BlockSchema.parse(body); }
  catch { return NextResponse.json({ error: 'Invalid data' }, { status: 422 }); }

  const dateObj = new Date(`${parsed.date}T00:00:00Z`);

  const row = await prisma.operatorAvailability.upsert({
    where:  { date: dateObj },
    update: { maxGroups: parsed.maxGroups, note: parsed.note ?? null },
    create: { date: dateObj, maxGroups: parsed.maxGroups, note: parsed.note ?? null },
  });

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const date = new URL(request.url).searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 });

  const dateObj = new Date(`${date}T00:00:00Z`);
  await prisma.operatorAvailability.deleteMany({ where: { date: dateObj } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
