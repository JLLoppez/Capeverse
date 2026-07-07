import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { MessageCircle, Map, MapPin, Star, Calendar, TrendingUp } from 'lucide-react';

export default async function AdminDashboardPage() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [tours, attractions, totalEnquiries, recentEnquiries, pendingReviews, savedItineraries, funnelEvents] = await Promise.all([
    prisma.tour.count(),
    prisma.attraction.count(),
    prisma.enquiry.count(),
    prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' }, take: 8,
      select: { id: true, fullName: true, email: true, nationality: true, budgetRange: true, travelDate: true, groupSize: true, status: true, createdAt: true, interests: true },
    }),
    prisma.review.count({ where: { submittedAt: { not: null }, approved: false } }),
    prisma.savedItinerary.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.funnelEvent.groupBy({
      by: ['event'], where: { createdAt: { gte: thirtyDaysAgo } }, _count: { event: true },
    }),
  ]);

  const funnelMap: Record<string, number> = {};
  for (const row of funnelEvents) funnelMap[row.event] = row._count.event;

  const funnelSteps = [
    { step: 'Viewed tour',         count: funnelMap['viewed_tour']          ?? 0 },
    { step: 'Started planner',     count: funnelMap['started_planner']      ?? 0 },
    { step: 'Generated itinerary', count: funnelMap['generated_itinerary']  ?? 0 },
    { step: 'Saved itinerary',     count: funnelMap['saved_itinerary']      ?? 0 },
    { step: 'Submitted enquiry',   count: funnelMap['submitted_enquiry']    ?? 0 },
    { step: 'Completed booking',   count: funnelMap['completed_booking']    ?? 0 },
  ];
  const maxCount = Math.max(...funnelSteps.map(s => s.count), 1);

  const statCards = [
    { label: 'Tours',            value: tours,            icon: Map,           href: '/admin/tours',        accent: 'var(--ink)' },
    { label: 'Attractions',      value: attractions,      icon: MapPin,        href: '/admin/attractions',  accent: 'var(--jade)' },
    { label: 'Total enquiries',  value: totalEnquiries,   icon: MessageCircle, href: '/admin/enquiries',    accent: 'var(--sienna)' },
    { label: 'Saved itineraries (30d)', value: savedItineraries, icon: TrendingUp, href: '/admin/enquiries', accent: 'var(--mist)' },
  ];

  return (
    <div style={{ display: 'grid', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ marginBottom: '0.3rem' }}>Dashboard</h1>
        <p className="muted" style={{ fontSize: '0.85rem', fontWeight: 400 }}>Welcome back. Here's what's happening.</p>
      </div>

           {/* Stat cards */}
      <div className="grid-4 admin-stat-grid">
        {statCards.map(({ label, value, icon: Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            style={{ textDecoration: 'none' }}
          >
            <div
              className="panel admin-stat-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                transition: 'box-shadow 200ms, transform 200ms',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${accent}15`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} style={{ color: accent }} />
              </div>

              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.8rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: 'var(--ink)',
                  }}
                >
                  {value}
                </div>

                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--mist)',
                    marginTop: '0.15rem',
                    letterSpacing: '0.04em',
                  }}
                >
                  {label}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {/* Pending reviews alert */}
      {pendingReviews > 0 && (
        <Link href="/admin/reviews" style={{ textDecoration: 'none' }}>
          <div className="notice warn" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Star size={16} style={{ flexShrink: 0 }} />
            <span><strong>{pendingReviews}</strong> review{pendingReviews > 1 ? 's' : ''} waiting for approval</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem' }}>Review →</span>
          </div>
        </Link>
      )}

      <div className="grid-2 align-start">
        {/* Recent enquiries */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Recent enquiries</h3>
            <Link href="/admin/enquiries" style={{ fontSize: '0.78rem', color: 'var(--sienna)' }}>See all →</Link>
          </div>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {recentEnquiries.length === 0 ? (
              <div className="empty-state">No enquiries yet.</div>
            ) : recentEnquiries.map(enq => (
              <div key={enq.id} className="panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{enq.fullName}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--mist)' }}>
                    {enq.nationality ?? 'Unknown'} · {enq.groupSize ? `${enq.groupSize} pax` : '—'} · {enq.budgetRange ?? '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="status" style={{
                    background: enq.status === 'New' ? 'rgba(196,120,74,0.1)' : 'rgba(61,107,90,0.1)',
                    color: enq.status === 'New' ? 'var(--sienna)' : 'var(--jade)',
                  }}>{enq.status}</span>
                  <div style={{ fontSize: '0.66rem', color: 'rgba(13,31,45,0.3)', marginTop: '0.25rem' }}>
                    {new Date(enq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Funnel (30 days)</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--mist)' }}>Conversion</span>
          </div>
          <div className="panel" style={{ padding: '1.25rem', display: 'grid', gap: '0.65rem' }}>
            {funnelSteps.map((step, i) => {
              const prev = i > 0 ? funnelSteps[i - 1].count : null;
              const rate = prev && prev > 0 ? Math.round((step.count / prev) * 100) : null;
              const width = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
              const isBottom = step.step === 'Completed booking';
              return (
                <div key={step.step} style={{ display: 'grid', gap: '0.3rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <span style={{ color: isBottom ? 'var(--jade)' : 'var(--ink)', fontWeight: isBottom ? 700 : 400 }}>{step.step}</span>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {rate !== null && <span style={{ color: 'var(--jade)', fontWeight: 600, fontSize: '0.7rem' }}>{rate}%</span>}
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: isBottom ? 'var(--jade)' : 'var(--ink)', fontWeight: 600 }}>{step.count.toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'rgba(13,31,45,0.07)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${width}%`, background: isBottom ? 'var(--jade)' : 'var(--sienna)', borderRadius: 999, transition: 'width 600ms ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.85rem' }}>
            <Link href="/admin/availability" className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <Calendar size={13} />Availability
            </Link>
            <Link href="/admin/reviews" className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
              <Star size={13} />Reviews
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
