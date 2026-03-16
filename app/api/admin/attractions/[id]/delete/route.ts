import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  }
  const { id } = await params;
  await prisma.attraction.delete({ where: { id } });
  return NextResponse.redirect(new URL('/admin/attractions', request.url), 303);
}
