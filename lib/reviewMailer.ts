import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mail';

export async function requestReviewForBooking(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tour: { select: { id: true, title: true, slug: true } } },
  });

  if (!booking || booking.reviewRequested) return;
  if (booking.status !== 'Confirmed') return;

  // ── Atomic: create review + mark booking in one transaction ─────────────
  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: { tourId: booking.tour.id, bookingId: booking.id },
    });
    await tx.booking.update({
      where: { id: bookingId },
      data: { reviewRequested: true },
    });
    return created;
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://capeverse.co.za';
  const reviewUrl = `${baseUrl}/review/${review.reviewToken}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:540px;margin:0 auto;color:#1F2933;">
      <p style="font-size:1.1rem;font-weight:700;color:#0E4D64;">We hope you had an amazing time</p>
      <p>Hi ${booking.customerName},</p>
      <p>Thank you for choosing our private Cape Town experience. We'd love to hear how it went — your feedback takes just 2 minutes and helps other travellers plan their perfect trip.</p>
      <a href="${reviewUrl}" style="display:inline-block;margin:1.25rem 0;padding:0.75rem 1.5rem;background:#F2A65A;color:#fff;border-radius:999px;text-decoration:none;font-weight:700;">
        Leave a review for ${booking.tour.title}
      </a>
      <p style="font-size:0.78rem;color:#6b7a83;">This link is personal to you and expires in 60 days.</p>
    </div>
  `;

  const result = await sendEmail({
    to: booking.customerEmail,
    subject: `How was your ${booking.tour.title} experience?`,
    html,
    text: `Hi ${booking.customerName}, we'd love your review: ${reviewUrl}`,
  });

  // If SMTP is not configured, log so it's visible in production monitoring
  if (!result.sent) {
    console.warn(`[reviewMailer] Email not sent for booking ${bookingId}: ${result.reason}`);
  }
}

export async function sendPendingReviewRequests(): Promise<number> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - 2);
  const dayStart = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

  const eligibleBookings = await prisma.booking.findMany({
    where: {
      status: 'Confirmed',
      reviewRequested: false,
      travelDate: { gte: dayStart, lte: dayEnd },
    },
    select: { id: true },
  });

  let sent = 0;
  for (const booking of eligibleBookings) {
    try {
      await requestReviewForBooking(booking.id);
      sent++;
    } catch (err) {
      console.error(`[reviewMailer] Failed for booking ${booking.id}:`, err);
    }
  }
  return sent;
}
