/**
 * Public endpoint — returns blocked/limited dates for the next 12 months.
 * Used by the booking form and enquiry date picker to disable unavailable dates.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const from = new Date();
  const to   = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  const blocked = await prisma.operatorAvailability.findMany({
    where: { date: { gte: from, lte: to } },
    select: { date: true, maxGroups: true, note: true },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json({
    blockedDates: blocked
      .filter((b) => b.maxGroups === 0)
      .map((b) => b.date.toISOString().split('T')[0]),
    limitedDates: blocked
      .filter((b) => b.maxGroups > 0)
      .map((b) => ({ date: b.date.toISOString().split('T')[0], maxGroups: b.maxGroups })),
  });
}
