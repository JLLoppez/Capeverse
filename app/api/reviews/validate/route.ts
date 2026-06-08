import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const review = await prisma.review.findUnique({ where: { reviewToken: token } });
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (review.submittedAt) return NextResponse.json({ error: 'Already submitted' }, { status: 409 });

  return NextResponse.json({ tourId: review.tourId });
}
