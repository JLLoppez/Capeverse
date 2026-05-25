import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export default async function AdminTourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const { id } = await params;
  const tour = await prisma.tour.findUnique({
    where: { id },
    include: {
      availability: { orderBy: { blockedDate: 'asc' } },
    },
  });
  if (!tour) notFound();

  const today = new Date();
  // Only show future blocked dates
  const futureBlocked = tour.availability.filter((a) => new Date(a.blockedDate) >= today);

  return (
    <div className="section-stack">
      <div>
        <span className="eyebrow">Admin · Tours</span>
        <h1>{tour.title}</h1>
        <p className="lead">{tour.summary}</p>
      </div>

      <div className="grid-two">
        {/* Tour details form */}
        <div className="panel section-stack">
          <h2>Edit tour</h2>
          <form action={`/api/admin/tours/${id}`} method="post" className="stack-form">
            <label><span>Title</span><input name="title" defaultValue={tour.title} required /></label>
            <label><span>Summary</span><textarea name="summary" rows={3} defaultValue={tour.summary} /></label>
            <label><span>Description</span><textarea name="description" rows={5} defaultValue={tour.description} /></label>
            <label>
              <span>Category</span>
              <select name="category" defaultValue={tour.category}>
                <option>Day Tour</option><option>Half Day</option><option>Multi-Day</option><option>Transfer</option><option>Speciality</option>
              </select>
            </label>
            <label><span>Duration type</span><input name="durationType" defaultValue={tour.durationType} /></label>
            <label><span>Price from (ZAR)</span><input name="priceFrom" type="number" step="50" defaultValue={Number(tour.priceFrom)} /></label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.88rem' }}>
                <input type="checkbox" name="isFeatured" defaultChecked={tour.isFeatured} /> Featured
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.88rem' }}>
                <input type="checkbox" name="isActive" defaultChecked={tour.isActive} /> Active
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.88rem' }}>
                <input type="checkbox" name="isPrivate" defaultChecked={tour.isPrivate} /> Private
              </label>
            </div>
            <button className="button">Save changes</button>
          </form>
        </div>

        {/* Availability management */}
        <div className="panel section-stack">
          <h2>Availability & date blocking</h2>
          <p style={{ fontSize: '0.85rem', color: '#4a5a63' }}>
            Block dates that are fully booked, unavailable, or have reduced capacity. Blocked dates are checked before confirming bookings.
          </p>

          <form action={`/api/admin/tours/${id}/availability`} method="post" className="stack-form">
            <label><span>Date to block *</span><input type="date" name="blockedDate" required min={today.toISOString().slice(0, 10)} /></label>
            <label><span>Reason (optional)</span><input type="text" name="reason" placeholder="e.g. Fully booked, Guide unavailable" /></label>
            <label><span>Max capacity override (optional)</span><input type="number" name="maxCapacity" min="1" placeholder="Leave blank to fully block" /></label>
            <button className="button" style={{ background: '#dc2626', borderColor: '#dc2626' }}>Block date</button>
          </form>

          {futureBlocked.length > 0 ? (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700, marginBottom: '0.75rem' }}>
                Blocked dates ({futureBlocked.length})
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {futureBlocked.map((a) => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1F2933' }}>
                        {new Date(a.blockedDate).toDateString()}
                      </span>
                      {a.reason && <span style={{ fontSize: '0.78rem', color: '#6b7280', marginLeft: '0.5rem' }}>— {a.reason}</span>}
                      {a.maxCapacity && <span style={{ fontSize: '0.72rem', color: '#d97706', marginLeft: '0.5rem' }}>Max: {a.maxCapacity} pax</span>}
                    </div>
                    <form action={`/api/admin/tours/${id}/availability`} method="post" style={{ margin: 0 }}>
                      <input type="hidden" name="_method" value="DELETE" />
                      <input type="hidden" name="blockedDate" value={a.blockedDate.toISOString().slice(0, 10)} />
                      <button
                        type="submit"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(220,38,38,0.3)', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: '#9ca3af', fontStyle: 'italic' }}>No dates blocked — all future dates are available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
