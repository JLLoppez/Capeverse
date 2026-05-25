/**
 * Fixes:
 * - Bug 17: Removed `(prisma as any).tourAvailability` cast — model is in schema,
 *   so prisma.tourAvailability is typed correctly.
 * - tourAvailability.findFirst can return null; handled cleanly without optional chaining.
 */

import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ConvertSchema = z.object({
  tourId:    z.string().cuid(),
  travelDate: z.string().min(1),
  groupSize: z.string().transform(Number),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url), 303);
  }

  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });

  const formData = await request.formData();
  const parsed = ConvertSchema.safeParse({
    tourId:    formData.get('tourId'),
    travelDate: formData.get('travelDate'),
    groupSize: formData.get('groupSize'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL(`/admin/enquiries/${id}?error=Invalid+form+data`, request.url),
      303
    );
  }

  const { tourId, travelDate, groupSize } = parsed.data;

  const tour = await prisma.tour.findUnique({ where: { id: tourId, isActive: true } });
  if (!tour) {
    return NextResponse.redirect(
      new URL(`/admin/enquiries/${id}?error=Tour+not+found`, request.url),
      303
    );
  }

  // Check if the date is blocked in TourAvailability
  const blockedEntry = await prisma.tourAvailability.findFirst({
    where: { tourId, blockedDate: new Date(travelDate) },
  });

  if (blockedEntry) {
    // Allow if maxCapacity is set and groupSize fits
    const capacityOk =
      blockedEntry.maxCapacity != null && groupSize <= blockedEntry.maxCapacity;

    if (!capacityOk) {
      const msg = blockedEntry.reason
        ? `Blocked: ${blockedEntry.reason}`
        : 'That date is blocked for this tour';
      return NextResponse.redirect(
        new URL(`/admin/enquiries/${id}?error=${encodeURIComponent(msg)}`, request.url),
        303
      );
    }
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    // No Stripe — create a manual booking record directly
    const booking = await prisma.booking.create({
      data: {
        tourId,
        stripeSessionId: `manual-${crypto.randomUUID()}`,
        customerName:    enquiry.fullName,
        customerEmail:   enquiry.email,
        travelDate:      new Date(travelDate),
        groupSize,
        amountZar:       Math.round(Number(tour.priceFrom)) * groupSize,
        status:          'Confirmed',
      },
    });

    await prisma.enquiry.update({
      where: { id },
      data: { status: 'Confirmed', convertedToBookingId: booking.id },
    });

    return NextResponse.redirect(
      new URL(`/admin/enquiries/${id}?updated=1`, request.url),
      303
    );
  }

  // Stripe path — generate a checkout session
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

  const unitAmount  = Math.round(Number(tour.priceFrom) * 100);
  const totalAmount = unitAmount * groupSize;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: enquiry.email,
    line_items: [
      {
        price_data: {
          currency: 'zar',
          unit_amount: totalAmount,
          product_data: {
            name: tour.title,
            description: `${groupSize} person(s) · ${travelDate} · Converted from enquiry #${id.slice(0, 8)}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      tourId,
      travelDate,
      groupSize:    String(groupSize),
      customerName: enquiry.fullName,
      enquiryId:    id,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/enquiries/${id}?updated=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_SITE_URL}/admin/enquiries/${id}`,
  });

  await prisma.enquiry.update({
    where: { id },
    data: { status: 'Quote Sent' },
  });

  return NextResponse.redirect(session.url!, 303);
}
