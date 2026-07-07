import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const FunnelEventSchema = z.object({
  event: z.enum([
    'viewed_tour',
    'started_planner',
    'generated_itinerary',
    'saved_itinerary',
    'submitted_enquiry',
    'completed_booking',
  ]),
  sessionId: z.string().max(100).optional(),
  tourId: z.string().optional(),
  path: z.string().max(300).optional(),
  meta: z.record(z.unknown()).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  let parsed: z.infer<typeof FunnelEventSchema>;
  try { parsed = FunnelEventSchema.parse(body); }
  catch { return NextResponse.json({ ok: false }, { status: 422 }); }

  await prisma.funnelEvent.create({
    data: {
      ...parsed,
      meta: parsed.meta as Prisma.InputJsonValue | undefined,
    },
  }).catch(() => {});
  return NextResponse.json({ ok: true });
}
