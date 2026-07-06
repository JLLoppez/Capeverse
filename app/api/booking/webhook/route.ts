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
  const sig  = request.headers.get('stripe-signature') ?? '';

  let event: import('stripe').Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as import('stripe').Stripe.Checkout.Session;
    const { tourId, travelDate, groupSize, customerName } = session.metadata ?? {};

    if (!tourId || !session.customer_email) {
      console.warn('[webhook] Missing metadata on session', session.id);
      return NextResponse.json({ received: true });
    }

    // Create a proper Booking record (not an Enquiry)
    await prisma.booking.create({
      data: {
        tourId,
        stripeSessionId: session.id,
        customerName: customerName ?? 'Stripe Customer',
        customerEmail: session.customer_email,
        travelDate: travelDate ? new Date(travelDate) : null,
        groupSize: groupSize ? parseInt(groupSize, 10) : 1,
        amountZar: session.amount_total ? Math.round(session.amount_total / 100) : 0,
        status: 'Confirmed',
      },
    });

    // Track funnel event
    await prisma.funnelEvent.create({
      data: { event: 'completed_booking', meta: { tourId, sessionId: session.id } },
    }).catch(() => {});

    // Confirmation email
    await sendEmail({
      to: session.customer_email,
      subject: 'Your Cape Town booking is confirmed!',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;color:#0B0F1F;">
          <p style="font-size:1.1rem;font-weight:700;color:#7C3AED;">Booking confirmed ✨</p>
          <p>Hi ${customerName},</p>
          <p>Your booking is confirmed. Our team will be in touch within 24 hours to finalise your itinerary details.</p>
          <p style="margin-bottom:0;">Warmly,<br/><strong>The Capeverse Team</strong></p>
        </div>
      `,
      text: `Hi ${customerName}, your booking is confirmed. Our team will be in touch within 24 hours.`,
    });
  }

  return NextResponse.json({ received: true });
}
