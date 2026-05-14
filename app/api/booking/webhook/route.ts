import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mail';

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

  const body = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';

  let event: import('stripe').Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as import('stripe').Stripe.Checkout.Session;
    const { tourId, travelDate, groupSize, customerName } = session.metadata ?? {};

    if (tourId && session.customer_email) {
      // Create a confirmed enquiry record for the booking
      await prisma.enquiry.create({
        data: {
          fullName: customerName ?? 'Stripe Customer',
          email: session.customer_email,
          travelDate: travelDate ? new Date(travelDate) : null,
          groupSize: groupSize ? parseInt(groupSize) : null,
          status: 'Confirmed',
          source: 'stripe-checkout',
          message: `Booking confirmed via Stripe. Session: ${session.id}`,
        },
      });

      // Send confirmation email
      await sendEmail({
        to: session.customer_email,
        subject: 'Your Cape Town booking is confirmed!',
        html: `<p>Hi ${customerName},</p><p>Your booking is confirmed. Our team will be in touch within 24 hours to finalise your itinerary details.</p><p>— The Capiverse Team</p>`,
        text: `Hi ${customerName}, your booking is confirmed. Our team will be in touch within 24 hours.`,
      });
    }
  }

  return NextResponse.json({ received: true });
}
