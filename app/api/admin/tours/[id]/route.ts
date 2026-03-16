import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toBool(value: FormDataEntryValue | null) {
  return String(value) === 'true';
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  }
  const { id } = await params;
  const formData = await request.formData();

  await prisma.tour.update({
    where: { id },
    data: {
      title: String(formData.get('title') || ''),
      slug: String(formData.get('slug') || ''),
      summary: String(formData.get('summary') || ''),
      description: String(formData.get('description') || ''),
      durationType: String(formData.get('durationType') || ''),
      category: String(formData.get('category') || ''),
      priceFrom: String(formData.get('priceFrom') || '0'),
      imageUrl: String(formData.get('imageUrl') || '') || null,
      highlights: String(formData.get('highlights') || '').split(',').map((i) => i.trim()).filter(Boolean),
      isFeatured: toBool(formData.get('isFeatured')),
      isPrivate: toBool(formData.get('isPrivate')),
      isActive: toBool(formData.get('isActive'))
    }
  });

  return NextResponse.redirect(new URL('/admin/tours', request.url), 303);
}
