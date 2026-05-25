import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export default async function AdminEnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) notFound();

  const interests = Array.isArray(enquiry.interests) ? (enquiry.interests as string[]) : [];
  const mustSee = Array.isArray(enquiry.mustSee) ? (enquiry.mustSee as string[]) : [];
  const tours = await prisma.tour.findMany({ where: { isActive: true }, orderBy: { title: 'asc' } });

  // Follow-up overdue indicator
  const followUpOverdue =
    enquiry.followUpDate && new Date(enquiry.followUpDate) < new Date() && enquiry.status !== 'Confirmed';

  return (
    <div className="section-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span className="eyebrow">Admin · Enquiries</span>
          <h1>{enquiry.fullName}</h1>
          <p className="lead">{enquiry.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: enquiry.status === 'Confirmed' ? 'rgba(22,163,74,0.1)' : followUpOverdue ? 'rgba(220,38,38,0.1)' : 'rgba(14,77,100,0.08)',
            color: enquiry.status === 'Confirmed' ? '#16a34a' : followUpOverdue ? '#dc2626' : '#0E4D64',
          }}>
            {enquiry.status}
          </span>
          {followUpOverdue && (
            <span style={{ padding: '0.35rem 0.85rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(220,38,38,0.1)', color: '#dc2626' }}>
              ⚠ Follow-up overdue
            </span>
          )}
        </div>
      </div>

      <div className="grid-two">
        {/* Left: Client details */}
        <div className="panel section-stack">
          <h2>Client request</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <tbody>
              {[
                ['Phone', enquiry.phone || '—'],
                ['Travel date', enquiry.travelDate ? enquiry.travelDate.toISOString().slice(0, 10) : '—'],
                ['Group size', enquiry.groupSize ?? '—'],
                ['Budget', enquiry.budgetRange || '—'],
                ['Trip length', enquiry.tripLengthDays ? `${enquiry.tripLengthDays} days` : '—'],
                ['Pace', enquiry.pace || '—'],
                ['Travel style', enquiry.travelStyle || '—'],
                ['Nationality', (enquiry as any).nationality || '—'],
                ['Source', enquiry.source],
                ['Submitted', enquiry.createdAt.toLocaleString()],
              ].map(([label, value]) => (
                <tr key={label as string}>
                  <td style={{ padding: '6px 0', fontWeight: 600, color: '#4a5a63', width: '38%' }}>{label}</td>
                  <td style={{ padding: '6px 0', color: '#1F2933' }}>{value as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(interests.length > 0 || mustSee.length > 0) && (
            <div style={{ marginTop: '1rem' }}>
              {interests.length > 0 && <p style={{ fontSize: '0.85rem' }}><strong>Interests:</strong> {interests.join(', ')}</p>}
              {mustSee.length > 0 && <p style={{ fontSize: '0.85rem' }}><strong>Must-see:</strong> {mustSee.join(', ')}</p>}
            </div>
          )}
          {enquiry.message && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f7f5f0', borderRadius: '10px', fontSize: '0.88rem' }}>
              <strong>Message:</strong>
              <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap' }}>{enquiry.message}</p>
            </div>
          )}

          {/* AI Chat Summary */}
          {enquiry.aiChatSummary && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1d4ed8', fontWeight: 700, marginBottom: '0.5rem' }}>
                AI Assistant conversation
              </div>
              <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', color: '#374151' }}>
                {enquiry.aiChatSummary}
              </pre>
            </div>
          )}

          {/* AI Itinerary Summary */}
          {enquiry.aiSummary && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#15803d', fontWeight: 700, marginBottom: '0.5rem' }}>
                AI itinerary summary
              </div>
              <p style={{ margin: 0 }}>{enquiry.aiSummary}</p>
            </div>
          )}
        </div>

        {/* Right: CRM actions */}
        <div style={{ display: 'grid', gap: '1rem' }}>
          {/* Status + Notes form */}
          <div className="panel section-stack">
            <h2>Status & notes</h2>
            <form action={`/api/admin/enquiries/${enquiry.id}`} method="post" className="stack-form">
              <label>
                <span>Pipeline status</span>
                <select name="status" defaultValue={enquiry.status}>
                  <option>New</option>
                  <option>Reviewed</option>
                  <option>Contacted</option>
                  <option>Awaiting Client Reply</option>
                  <option>Quote Sent</option>
                  <option>Confirmed</option>
                  <option>Closed Lost</option>
                  <option>Cancelled</option>
                </select>
              </label>
              <label>
                <span>Follow-up date</span>
                <input
                  type="date"
                  name="followUpDate"
                  defaultValue={enquiry.followUpDate ? enquiry.followUpDate.toISOString().slice(0, 10) : ''}
                />
              </label>
              <label>
                <span>Follow-up note</span>
                <input
                  type="text"
                  name="followUpNote"
                  defaultValue={enquiry.followUpNote || ''}
                  placeholder="e.g. Call back Thursday to confirm transport"
                />
              </label>
              <label>
                <span>Consultant notes</span>
                <textarea name="consultantNotes" rows={6} defaultValue={enquiry.consultantNotes || ''} />
              </label>
              <button className="button">Save changes</button>
            </form>
          </div>

          {/* Convert to booking */}
          {enquiry.status !== 'Confirmed' && !enquiry.convertedToBookingId && (
            <div className="panel section-stack">
              <h2>Convert to booking</h2>
              <p style={{ fontSize: '0.85rem', color: '#4a5a63' }}>
                Generate a Stripe payment link for this enquiry to move it directly to a confirmed booking.
              </p>
              <form action={`/api/admin/enquiries/${enquiry.id}/convert`} method="post" className="stack-form">
                <label>
                  <span>Tour *</span>
                  <select name="tourId" required>
                    <option value="">Select a tour…</option>
                    {tours.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} — R {Number(t.priceFrom).toLocaleString()} p/p
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Travel date *</span>
                  <input
                    type="date"
                    name="travelDate"
                    required
                    defaultValue={enquiry.travelDate ? enquiry.travelDate.toISOString().slice(0, 10) : ''}
                  />
                </label>
                <label>
                  <span>Group size *</span>
                  <input
                    type="number"
                    name="groupSize"
                    min="1"
                    max="500"
                    required
                    defaultValue={enquiry.groupSize ?? 2}
                  />
                </label>
                <button className="button" style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                  Generate payment link
                </button>
              </form>
            </div>
          )}

          {enquiry.convertedToBookingId && (
            <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#15803d', fontWeight: 600 }}>
                ✅ Converted to booking
              </p>
              <Link href={`/admin/bookings`} style={{ fontSize: '0.82rem', color: '#15803d' }}>
                View booking →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
