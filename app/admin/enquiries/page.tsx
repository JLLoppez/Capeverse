import Link from 'next/link';
import { prisma } from '@/lib/prisma';

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  New:          { bg: 'rgba(196,120,74,0.1)',  color: 'var(--sienna)' },
  Contacted:    { bg: 'rgba(143,168,181,0.15)', color: 'var(--mist)' },
  Quoted:       { bg: 'rgba(61,107,90,0.1)',   color: 'var(--jade)' },
  Confirmed:    { bg: 'rgba(61,107,90,0.18)',  color: 'var(--jade)' },
  Lost:         { bg: 'rgba(13,31,45,0.07)',   color: 'rgba(13,31,45,0.4)' },
};

export default async function AdminEnquiriesPage() {
  const enquiries = await prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' } });
  const newCount  = enquiries.filter(e => e.status === 'New').length;

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.3rem' }}>Enquiries</h1>
          <p className="muted" style={{ fontSize: '0.84rem', fontWeight: 400 }}>
            {enquiries.length} total · <span style={{ color: 'var(--sienna)', fontWeight: 600 }}>{newCount} new</span>
          </p>
        </div>
      </div>

      {enquiries.length === 0 ? (
        <div className="empty-state">No enquiries yet. They'll appear here as soon as travellers submit the form.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Nationality</th>
                <th>Travel date</th>
                <th>Pax</th>
                <th>Budget</th>
                <th>Interests</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map(enq => {
                const style = STATUS_STYLES[enq.status] ?? STATUS_STYLES['New'];
                const interests = Array.isArray(enq.interests) ? (enq.interests as string[]).slice(0, 3) : [];
                return (
                  <tr key={enq.id}>
                    <td style={{ fontWeight: 600 }}>{enq.fullName}</td>
                    <td><a href={`mailto:${enq.email}`} style={{ color: 'var(--sienna)' }}>{enq.email}</a></td>
                    <td className="muted">{enq.nationality ?? '—'}</td>
                    <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                      {enq.travelDate ? new Date(enq.travelDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="muted">{enq.groupSize ?? '—'}</td>
                    <td><span className="pill">{enq.budgetRange ?? '—'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {interests.map(i => <span key={i} className="badge">{i}</span>)}
                      </div>
                    </td>
                    <td>
                      <span className="status" style={{ background: style.bg, color: style.color }}>{enq.status}</span>
                    </td>
                    <td className="muted" style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      {new Date(enq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
