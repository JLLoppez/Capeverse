import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);

  const [
    // Existing
    enquiries,
    bookings,
    recentEnquiries,
    // Funnel
    funnelEvents30d,
    // Reviews
    pendingReviews,
    approvedReviews,
    // Saved itineraries
    savedItineraries30d,
    // Page views
    topPages,
  ] = await Promise.all([
    prisma.enquiry.count(),
    prisma.booking.aggregate({ _sum: { amountZar: true }, _count: { id: true } }),
    prisma.enquiry.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true, fullName: true, email: true, nationality: true,
        travelDate: true, groupSize: true, budgetRange: true,
        tripLengthDays: true, status: true, createdAt: true,
        interests: true,
      },
    }),
    prisma.funnelEvent.groupBy({
      by: ['event'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { event: true },
    }),
    prisma.review.count({ where: { submittedAt: { not: null }, approved: false } }),
    prisma.review.findMany({
      where: { approved: true },
      orderBy: { submittedAt: 'desc' },
      take: 10,
      select: { id: true, rating: true, body: true, authorName: true, submittedAt: true, tourId: true },
    }),
    prisma.savedItinerary.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.pageView.groupBy({
      by: ['path'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { path: true },
      orderBy: { _count: { path: 'desc' } },
      take: 10,
    }),
  ]);

  // Build funnel conversion table
  const funnelMap: Record<string, number> = {};
  for (const row of funnelEvents30d) {
    funnelMap[row.event] = row._count.event;
  }
  const funnelSteps = [
    { step: 'Viewed tour',          count: funnelMap['viewed_tour']          ?? 0 },
    { step: 'Started planner',      count: funnelMap['started_planner']      ?? 0 },
    { step: 'Generated itinerary',  count: funnelMap['generated_itinerary']  ?? 0 },
    { step: 'Saved itinerary',      count: funnelMap['saved_itinerary']      ?? 0 },
    { step: 'Submitted enquiry',    count: funnelMap['submitted_enquiry']    ?? 0 },
    { step: 'Completed booking',    count: funnelMap['completed_booking']    ?? 0 },
  ];

  // Conversion rates between adjacent steps
  const funnelWithRates = funnelSteps.map((step, i) => ({
    ...step,
    conversionFromPrev: i === 0
      ? null
      : funnelSteps[i - 1].count > 0
        ? Math.round((step.count / funnelSteps[i - 1].count) * 100)
        : null,
  }));

  // Budget breakdown
  const budgetBreakdown = await prisma.enquiry.groupBy({
    by: ['budgetRange'],
    _count: { budgetRange: true },
    where: { budgetRange: { not: null }, createdAt: { gte: thirtyDaysAgo } },
  });

  // Interest breakdown from enquiries
  const enquiriesWithInterests = await prisma.enquiry.findMany({
    where: { interests: { not: null }, createdAt: { gte: thirtyDaysAgo } },
    select: { interests: true },
  });
  const interestTally: Record<string, number> = {};
  for (const e of enquiriesWithInterests) {
    const tags = e.interests as string[] | null;
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        interestTally[tag] = (interestTally[tag] ?? 0) + 1;
      }
    }
  }
  const topInterests = Object.entries(interestTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([interest, count]) => ({ interest, count }));

  return NextResponse.json({
    totals: {
      enquiries,
      bookings: bookings._count.id,
      revenueZar: bookings._sum.amountZar ?? 0,
      savedItineraries30d,
      pendingReviews,
    },
    funnel: funnelWithRates,
    recentEnquiries,
    budgetBreakdown: budgetBreakdown.map((b) => ({
      range: b.budgetRange,
      count: b._count.budgetRange,
    })),
    topInterests,
    approvedReviews,
    topPages: topPages.map((p) => ({ path: p.path, views: p._count.path })),
  });
}
