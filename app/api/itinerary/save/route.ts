import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { rateLimitResponse } from '@/lib/rateLimit';
import { z } from 'zod';

const SaveSchema = z.object({
  itineraryJson: z.record(z.unknown()),
  inputJson: z.record(z.unknown()),
  days: z.number().int().min(1).max(14),
  budget: z.string().max(60),
  pace: z.string().max(60),
  groupType: z.string().max(60),
  interests: z.array(z.string()).min(1).max(10),
});

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, 'public');
  if (limited) return limited;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  let parsed: z.infer<typeof SaveSchema>;
  try { parsed = SaveSchema.parse(body); }
  catch { return NextResponse.json({ error: 'Invalid request' }, { status: 422 }); }

  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  const saved = await prisma.savedItinerary.create({
    data: {
      token: crypto.randomUUID(),
      itineraryJson: parsed.itineraryJson as Prisma.InputJsonValue,
      inputJson: parsed.inputJson as Prisma.InputJsonValue,
      days: parsed.days,
      budget: parsed.budget,
      pace: parsed.pace,
      groupType: parsed.groupType,
      interests: parsed.interests,
      expiresAt,
    },
  });

  // Track funnel event
  await prisma.funnelEvent.create({
    data: { event: 'saved_itinerary', meta: { token: saved.token } },
  }).catch(() => {});

  return NextResponse.json({ token: saved.token, expiresAt: saved.expiresAt });
}
