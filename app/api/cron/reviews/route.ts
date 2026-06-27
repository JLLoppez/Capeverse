import { NextResponse } from 'next/server';
import { sendPendingReviewRequests } from '@/lib/reviewMailer';

// Vercel cron: add to vercel.json → { "crons": [{ "path": "/api/cron/reviews", "schedule": "0 9 * * *" }] }
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Refuse to run if CRON_SECRET is not configured — an empty secret would
  // allow any request with "Authorization: Bearer " to trigger this endpoint.
  if (!cronSecret) {
    console.error('[cron] CRON_SECRET is not set — refusing to execute to prevent open access.');
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sent = await sendPendingReviewRequests();
  return NextResponse.json({ ok: true, sent });
}
