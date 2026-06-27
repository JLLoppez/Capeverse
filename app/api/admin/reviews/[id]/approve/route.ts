import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

// Fix 6: Updated to Next.js 15 async params pattern (replaces deprecated context: any)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const review = await prisma.review.update({
    where: { id },
    data: { approved: true },
  });

  return NextResponse.json({ ok: true, review });
}
