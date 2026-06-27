import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fix 6: Updated to Next.js 15 async params pattern (replaces deprecated context: any)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const saved = await prisma.savedItinerary.findUnique({ where: { token } });

  if (!saved) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
  }

  if (saved.expiresAt < new Date()) {
    return NextResponse.json({ error: 'This itinerary link has expired' }, { status: 410 });
  }

  return NextResponse.json({
    token:      saved.token,
    itinerary:  saved.itineraryJson,
    input:      saved.inputJson,
    days:       saved.days,
    budget:     saved.budget,
    pace:       saved.pace,
    groupType:  saved.groupType,
    interests:  saved.interests,
    createdAt:  saved.createdAt,
    expiresAt:  saved.expiresAt,
  });
}
