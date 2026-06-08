import { NextResponse } from 'next/server';
import { sendPendingReviewRequests } from '@/lib/reviewMailer';

// Vercel cron: add to vercel.json → { "crons": [{ "path": "/api/cron/reviews", "schedule": "0 9 * * *" }] }
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sent = await sendPendingReviewRequests();
  return NextResponse.json({ ok: true, sent });
}
