import { NextResponse } from 'next/server';
import { rateLimitResponse } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const BookingSchema = z.object({
  tourId: z.string().cuid(),
  travelDate: z.string().min(1),
  groupSize: z.number().int().min(1).max(500),
  customerEmail: z.string().email(),
  customerName: z.string().min(2),
});

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, 'public');
  if (limited) return limited;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Payments are not yet configured. Please submit an enquiry instead.' },
      { status: 503 }
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 422 });
  }

  const { tourId, travelDate, groupSize, customerEmail, customerName } = parsed.data;

  const tour = await prisma.tour.findUnique({ where: { id: tourId, isActive: true } });
  if (!tour) return NextResponse.json({ error: 'Tour not found' }, { status: 404 });

  // Dynamically import Stripe to avoid build errors when key is absent
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

  const unitAmount = Math.round(Number(tour.priceFrom) * 100); // ZAR cents
  const totalAmount = unitAmount * groupSize;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'zar',
          unit_amount: totalAmount,
          product_data: {
            name: tour.title,
            description: `${groupSize} person(s) · ${travelDate}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      tourId,
      travelDate,
      groupSize: String(groupSize),
      customerName,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/tours/${tour.slug}?booking=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
