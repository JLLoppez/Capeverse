import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/auth';

const PIPELINE_STAGES = [

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const { view } = await searchParams;
  const showKanban = view !== 'list';

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, fullName: true, email: true, groupSize: true, status: true, source: true,
      budgetRange: true, travelDate: true, followUpDate: true, followUpNote: true, createdAt: true,
    },
  });

  const today = new Date();

  // Bucket enquiries into pipeline stages
  const buckets: Record<string, typeof enquiries> = {};
  for (const stage of PIPELINE_STAGES) buckets[stage.key] = [];
  for (const e of enquiries) {
    const bucket = PIPELINE_STAGES.find((s) => s.key === e.status) ? e.status : 'New';
    buckets[bucket].push(e);
  }

  // Due for follow-up today
  const dueToday = enquiries.filter(
    (e) => e.followUpDate && new Date(e.followUpDate).toDateString() === today.toDateString()
  );
  const overdue = enquiries.filter(
    (e) => e.followUpDate && new Date(e.followUpDate) < today && e.status !== 'Confirmed'
  );

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#d4853a' }}>Admin</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem', color: '#1F2933' }}>Enquiries</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href="?view=kanban" style={{ padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, background: showKanban ? '#0E4D64' : 'transparent', color: showKanban ? '#fff' : '#0E4D64', border: '1.5px solid #0E4D64', textDecoration: 'none' }}>
            Pipeline
          </Link>
          <Link href="?view=list" style={{ padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600, background: !showKanban ? '#0E4D64' : 'transparent', color: !showKanban ? '#fff' : '#0E4D64', border: '1.5px solid #0E4D64', textDecoration: 'none' }}>
            List
          </Link>
        </div>
      </div>

      {/* Follow-up alerts */}
      {(dueToday.length > 0 || overdue.length > 0) && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {overdue.length > 0 && (
            <div style={{ padding: '0.85rem 1.1rem', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '12px', fontSize: '0.85rem', color: '#dc2626' }}>
              ⚠ <strong>{overdue.length} overdue follow-up{overdue.length > 1 ? 's' : ''}:</strong>{' '}
              {overdue.map((e, i) => (
                <span key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} style={{ color: '#dc2626', fontWeight: 600 }}>{e.fullName}</Link>
                  {i < overdue.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
          {dueToday.length > 0 && (
            <div style={{ padding: '0.85rem 1.1rem', background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.2)', borderRadius: '12px', fontSize: '0.85rem', color: '#d97706' }}>
              📅 <strong>Due today ({dueToday.length}):</strong>{' '}
              {dueToday.map((e, i) => (
                <span key={e.id}>
                  <Link href={`/admin/enquiries/${e.id}`} style={{ color: '#d97706', fontWeight: 600 }}>{e.fullName}</Link>
                  {e.followUpNote ? ` — ${e.followUpNote}` : ''}
                  {i < dueToday.length - 1 ? ' · ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {showKanban ? (
        /* KANBAN VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', overflowX: 'auto' }}>
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.key} style={{ minWidth: '200px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: stage.dot }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: stage.color }}>{stage.key}</span>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af' }}>{buckets[stage.key]?.length ?? 0}</span>
              </div>
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                {(buckets[stage.key] ?? []).map((e) => {
                  const isOverdue = e.followUpDate && new Date(e.followUpDate) < today && stage.key !== 'Confirmed';
                  return (
                    <Link key={e.id} href={`/admin/enquiries/${e.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: '#fff',
                        border: `1px solid ${isOverdue ? 'rgba(220,38,38,0.3)' : 'rgba(14,77,100,0.1)'}`,
                        borderRadius: '12px',
                        padding: '0.85rem',
                        transition: 'box-shadow 0.15s',
                        cursor: 'pointer',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1F2933', marginBottom: '0.25rem' }}>{e.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.4rem' }}>{e.email}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                          {e.budgetRange && <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: stage.bg, color: stage.color, fontWeight: 600 }}>{e.budgetRange.split(' ')[0]}</span>}
                          {e.groupSize && <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(0,0,0,0.05)', color: '#6b7280' }}>{e.groupSize}pax</span>}
                          {isOverdue && <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '999px', background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontWeight: 700 }}>⚠ overdue</span>}
                        </div>
                        {e.travelDate && <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.4rem' }}>✈ {e.travelDate.toISOString().slice(0, 10)}</div>}
                      </div>
                    </Link>
                  );
                })}
                {(buckets[stage.key] ?? []).length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed rgba(14,77,100,0.15)', borderRadius: '12px', fontSize: '0.78rem', color: '#9ca3af' }}>
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="panel table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Group</th>
                <th>Budget</th>
                <th>Travel date</th>
                <th>Follow-up</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => {
                const isOverdue = e.followUpDate && new Date(e.followUpDate) < today && e.status !== 'Confirmed';
                return (
                  <tr key={e.id} style={{ background: isOverdue ? 'rgba(220,38,38,0.03)' : undefined }}>
                    <td style={{ fontWeight: 600 }}>{e.fullName}</td>
                    <td>{e.email}</td>
                    <td>{e.groupSize ?? '—'}</td>
                    <td>{e.budgetRange?.split(' ')[0] ?? '—'}</td>
                    <td>{e.travelDate ? e.travelDate.toISOString().slice(0, 10) : '—'}</td>
                    <td style={{ color: isOverdue ? '#dc2626' : undefined, fontWeight: isOverdue ? 700 : undefined }}>
                      {e.followUpDate ? e.followUpDate.toISOString().slice(0, 10) : '—'}
                      {isOverdue ? ' ⚠' : ''}
                    </td>
                    <td><span className="status">{e.status}</span></td>
                    <td><Link href={`/admin/enquiries/${e.id}`}>Open →</Link></td>
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
