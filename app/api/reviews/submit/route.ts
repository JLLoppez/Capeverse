import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimitResponse } from '@/lib/rateLimit';
import { z } from 'zod';

const SubmitReviewSchema = z.object({
  token: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  body: z.string().min(10).max(1200),
  authorName: z.string().min(2).max(80),
});

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, 'public');
  if (limited) return limited;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  let parsed: z.infer<typeof SubmitReviewSchema>;
  try { parsed = SubmitReviewSchema.parse(body); }
  catch { return NextResponse.json({ error: 'Invalid review data' }, { status: 422 }); }

  const review = await prisma.review.findUnique({
    where: { reviewToken: parsed.token },
  });

  if (!review) return NextResponse.json({ error: 'Invalid review link' }, { status: 404 });
  if (review.submittedAt) return NextResponse.json({ error: 'Review already submitted' }, { status: 409 });

  await prisma.review.update({
    where: { id: review.id },
    data: {
      rating: parsed.rating,
      body: parsed.body,
      authorName: parsed.authorName,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
