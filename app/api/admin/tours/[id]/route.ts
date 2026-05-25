import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Fixes:
 * - Bug 9: slug was overwritten with '' because the edit form has no slug field.
 *   Now we only update slug if it's explicitly submitted and non-empty.
 * - toBool: HTML checkboxes submit "on" when checked and nothing when unchecked,
 *   not "true"/"false". Fixed to check for presence of the field.
 */

function toBool(value: FormDataEntryValue | null): boolean {
  // Checkboxes submit "on" when checked; absent when unchecked
  return value !== null && value !== '' && value !== 'false';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  }

  const { id } = await params;
  const formData = await request.formData();

  // Fetch current tour so we can preserve fields not in the form (e.g. slug)
  const existing = await prisma.tour.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) {
    return NextResponse.redirect(new URL('/admin/tours', request.url), 303);
  }

  const submittedSlug = String(formData.get('slug') ?? '').trim();

  await prisma.tour.update({
    where: { id },
    data: {
      title:       String(formData.get('title') ?? '').trim(),
      slug:        submittedSlug || existing.slug, // preserve if not submitted
      summary:     String(formData.get('summary') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim(),
      durationType: String(formData.get('durationType') ?? '').trim(),
      category:    String(formData.get('category') ?? '').trim(),
      priceFrom:   String(formData.get('priceFrom') ?? '0'),
      imageUrl:    String(formData.get('imageUrl') ?? '').trim() || null,
      highlights:  String(formData.get('highlights') ?? '')
                     .split(',')
                     .map((i) => i.trim())
                     .filter(Boolean),
      isFeatured:  toBool(formData.get('isFeatured')),
      isPrivate:   toBool(formData.get('isPrivate')),
      isActive:    toBool(formData.get('isActive')),
    },
  });

  return NextResponse.redirect(new URL('/admin/tours', request.url), 303);
}
