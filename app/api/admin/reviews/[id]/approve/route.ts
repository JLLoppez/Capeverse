import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const review = await prisma.review.update({
    where: { id: params.id },
    data: { approved: true },
  });

  return NextResponse.json({ ok: true, review });
}
