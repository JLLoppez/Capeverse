import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toBool(value: FormDataEntryValue | null) {
  return String(value) === 'true';
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  }
  const formData = await request.formData();
  await prisma.tour.create({
    data: {
      title: String(formData.get('title') || ''),
      slug: String(formData.get('slug') || ''),
      summary: String(formData.get('summary') || ''),
      description: String(formData.get('description') || ''),
      durationType: String(formData.get('durationType') || ''),
      category: String(formData.get('category') || ''),
      priceFrom: String(formData.get('priceFrom') || '0'),
      imageUrl: String(formData.get('imageUrl') || '') || null,
      highlights: JSON.stringify(String(formData.get('highlights') || '').split(',').map((item) => item.trim()).filter(Boolean)),
      isFeatured: toBool(formData.get('isFeatured')),
      isPrivate: toBool(formData.get('isPrivate')),
      isActive: true
    }
  });

  return NextResponse.redirect(new URL('/admin/tours', request.url), 303);
}
