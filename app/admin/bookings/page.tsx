import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminBookingsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    include: { tour: { select: { title: true, slug: true } } },
  });

  const totalRevenue = bookings
    .filter((b) => b.status === 'Confirmed')
    .reduce((sum, b) => sum + b.amountZar, 0);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d4853a' }}>Admin</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem', color: '#1F2933' }}>Bookings</h1>
        </div>
        <div style={{ background: '#fff', border: '1px solid rgba(14,77,100,0.1)', borderRadius: '12px', padding: '0.85rem 1.25rem', textAlign: 'right' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>Confirmed revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>R {totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Guest</th>
              <th>Email</th>
              <th>Tour</th>
              <th>Date</th>
              <th>Pax</th>
              <th>Amount (ZAR)</th>
              <th>Status</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 600 }}>{b.customerName}</td>
                <td>{b.customerEmail}</td>
                <td>
                  <Link href={`/admin/tours/${b.tourId}`} style={{ color: '#0E4D64', fontWeight: 500 }}>
                    {b.tour.title}
                  </Link>
                </td>
                <td>{b.travelDate ? b.travelDate.toISOString().slice(0, 10) : '—'}</td>
                <td>{b.groupSize}</td>
                <td style={{ fontWeight: 600, color: '#16a34a' }}>R {b.amountZar.toLocaleString()}</td>
                <td>
                  <span style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: b.status === 'Confirmed' ? 'rgba(22,163,74,0.1)' : 'rgba(14,77,100,0.08)',
                    color: b.status === 'Confirmed' ? '#16a34a' : '#0E4D64',
                  }}>
                    {b.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {b.stripeSessionId.startsWith('manual-') ? 'Manual' : 'Stripe'}
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>No bookings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
