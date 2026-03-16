import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  }
  const formData = await request.formData();
  await prisma.attraction.create({
    data: {
      name: String(formData.get('name') || ''),
      slug: String(formData.get('slug') || ''),
      region: String(formData.get('region') || ''),
      shortDescription: String(formData.get('shortDescription') || ''),
      fullDescription: String(formData.get('fullDescription') || ''),
      estimatedVisitMinutes: Number(formData.get('estimatedVisitMinutes') || 60),
      entranceFee: String(formData.get('entranceFee') || '') ? String(formData.get('entranceFee')) : null,
      imageUrl: String(formData.get('imageUrl') || '') || null,
      tags: JSON.stringify(String(formData.get('tags') || '').split(',').map((i) => i.trim()).filter(Boolean)),
      isActive: true
    }
  });

  return NextResponse.redirect(new URL('/admin/attractions', request.url), 303);
}
