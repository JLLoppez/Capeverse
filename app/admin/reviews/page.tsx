import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminReviewsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const [pending, approved] = await Promise.all([
    prisma.review.findMany({
      where: { submittedAt: { not: null }, approved: false },
      include: { tour: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.review.findMany({
      where: { approved: true },
      include: { tour: { select: { title: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 30,
    }),
  ]);

  const stars = (n: number | null) => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—';

  return (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      <div>
        <h1 style={{ marginBottom: '0.3rem' }}>Reviews</h1>
        <p className="muted" style={{ fontWeight: 400, fontSize: '0.85rem' }}>Approve submitted reviews before they appear publicly on tour pages.</p>
      </div>

      {/* Pending */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.1rem' }}>
          <h3>Awaiting approval</h3>
          {pending.length > 0 && (
            <span style={{ background: 'var(--sienna)', color: '#fff', borderRadius: '999px', fontSize: '0.68rem', padding: '0.15rem 0.55rem', fontWeight: 700 }}>
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="empty-state">No reviews waiting. You're all caught up.</div>
        ) : (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {pending.map(review => (
              <div key={review.id} className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.2rem' }}>
                      <strong>{review.authorName ?? 'Anonymous'}</strong>
                      <span className="muted" style={{ fontSize: '0.78rem' }}>on {review.tour.title}</span>
                    </div>
                    <span style={{ color: 'var(--sienna)', fontSize: '1rem', letterSpacing: '0.05em' }}>{stars(review.rating)}</span>
                  </div>
                  <form action={`/api/admin/reviews/${review.id}/approve`} method="post">
                    <button type="submit" className="btn btn-ink btn-sm">✓ Approve</button>
                  </form>
                </div>
                <p
  style={{
    fontSize: '0.95rem',
    lineHeight: 1.7,
    color: 'rgba(13,31,45,0.7)',
    fontStyle: 'italic',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
  }}
>
  "{review.body}"
</p>
                <p className="muted" style={{ fontSize: '0.72rem', marginTop: '0.65rem' }}>
                  Submitted {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <div>
        <h3 style={{ marginBottom: '1rem' }}>Approved reviews</h3>
        {approved.length === 0 ? (
          <div className="empty-state">No approved reviews yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Author</th><th>Tour</th><th>Rating</th><th>Date</th><th>Excerpt</th></tr>
              </thead>
              <tbody>
                {approved.map(review => (
                  <tr key={review.id}>
                    <td style={{ fontWeight: 600 }}>{review.authorName ?? '—'}</td>
                    <td className="muted">{review.tour.title}</td>
                    <td style={{ color: 'var(--sienna)' }}>{stars(review.rating)}</td>
                    <td className="muted" style={{ whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                      {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ fontSize: '0.82rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {review.body?.slice(0, 90)}{(review.body?.length ?? 0) > 90 ? '…' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
