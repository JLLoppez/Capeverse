/**
 * Fixes:
 * - Bug 10: DELETE handler read request.json() but the remove button submits a
 *   regular HTML form POST with a hidden _method=DELETE field — not a JSON DELETE request.
 *   Fixed by handling both POST (add) and POST with _method=DELETE (remove) in one handler.
 *   A real DELETE endpoint with JSON body is also kept for programmatic use.
 */

import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const AddSchema = z.object({
  blockedDate:  z.string().min(1, 'Date is required'),
  reason:       z.string().max(200).optional().nullable(),
  maxCapacity:  z.string().transform((v) => (v ? Number(v) : null)).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: tourId } = await params;
  const formData = await request.formData();

  // HTML forms can't send DELETE — we use a hidden _method field as an override
  const method = String(formData.get('_method') ?? '').toUpperCase();

  if (method === 'DELETE') {
    // Remove a blocked date
    const dateStr = String(formData.get('blockedDate') ?? '').trim();
    if (!dateStr) {
      return NextResponse.redirect(
        new URL(`/admin/tours/${tourId}?error=Missing+date`, request.url),
        303
      );
    }

    await prisma.tourAvailability.deleteMany({
      where: { tourId, blockedDate: new Date(dateStr) },
    });

    return NextResponse.redirect(
      new URL(`/admin/tours/${tourId}?saved=1`, request.url),
      303
    );
  }

  // Default POST: add a blocked date
  const parsed = AddSchema.safeParse({
    blockedDate:  formData.get('blockedDate'),
    reason:       formData.get('reason') || null,
    maxCapacity:  formData.get('maxCapacity') || null,
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL(`/admin/tours/${tourId}?error=Invalid+date`, request.url),
      303
    );
  }

  const { blockedDate, reason, maxCapacity } = parsed.data;

  await prisma.tourAvailability.upsert({
    where: {
      tourId_blockedDate: { tourId, blockedDate: new Date(blockedDate) },
    },
    update: { reason, maxCapacity },
    create: { tourId, blockedDate: new Date(blockedDate), reason, maxCapacity },
  });

  return NextResponse.redirect(
    new URL(`/admin/tours/${tourId}?saved=1`, request.url),
    303
  );
}

/** Programmatic DELETE endpoint (for fetch() calls with JSON body). */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: tourId } = await params;

  let date: string;
  try {
    const body = await request.json();
    date = String(body.date ?? '');
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 422 });
  }

  await prisma.tourAvailability.deleteMany({
    where: { tourId, blockedDate: new Date(date) },
  });

  return NextResponse.json({ ok: true });
}
