import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') ?? '30', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    totalEnquiries,
    newEnquiries,
    confirmedBookings,
    enquiriesByStatus,
    enquiriesBySource,
    recentEnquiries,
    topBudgets,
    avgGroupSize,
    activeTours,
    activeAttractions,
  ] = await Promise.all([
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { createdAt: { gte: since } } }),
    prisma.enquiry.count({ where: { status: 'Confirmed', createdAt: { gte: since } } }),
    prisma.enquiry.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.enquiry.groupBy({ by: ['source'], _count: { source: true } }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, fullName: true, email: true, status: true, createdAt: true, budgetRange: true, groupSize: true },
    }),
    prisma.enquiry.groupBy({ by: ['budgetRange'], _count: { budgetRange: true }, where: { budgetRange: { not: null } } }),
    prisma.enquiry.aggregate({ _avg: { groupSize: true }, where: { groupSize: { not: null } } }),
    prisma.tour.count({ where: { isActive: true } }),
    prisma.attraction.count({ where: { isActive: true } }),
  ]);

  const conversionRate = newEnquiries > 0
    ? Math.round((confirmedBookings / newEnquiries) * 100)
    : 0;

  return NextResponse.json({
    period: { days, since: since.toISOString() },
    overview: {
      totalEnquiries,
      newEnquiries,
      confirmedBookings,
      conversionRate,
      activeTours,
      activeAttractions,
      avgGroupSize: Math.round(avgGroupSize._avg.groupSize ?? 0),
    },
    enquiriesByStatus: Object.fromEntries(
      enquiriesByStatus.map((e) => [e.status, e._count.status])
    ),
    enquiriesBySource: Object.fromEntries(
      enquiriesBySource.map((e) => [e.source, e._count.source])
    ),
    topBudgets: topBudgets
      .sort((a, b) => b._count.budgetRange - a._count.budgetRange)
      .map((b) => ({ budget: b.budgetRange, count: b._count.budgetRange })),
    recentEnquiries,
  });
}
