import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminReviewsPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');

  const pending = await prisma.review.findMany({
    where: { submittedAt: { not: null }, approved: false },
    include: { tour: { select: { title: true } } },
    orderBy: { submittedAt: 'desc' },
  });

  const approved = await prisma.review.findMany({
    where: { approved: true },
    include: { tour: { select: { title: true } } },
    orderBy: { submittedAt: 'desc' },
    take: 30,
  });

  const stars = (n: number | null) => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Reviews</h1>

      {/* Pending approval */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>
          Awaiting approval
          {pending.length > 0 && (
            <span style={{ marginLeft: '0.75rem', background: 'var(--gold)', color: '#fff', borderRadius: '999px', fontSize: '0.72rem', padding: '0.15rem 0.55rem', fontWeight: 700 }}>
              {pending.length}
            </span>
          )}
        </h2>

        {pending.length === 0 ? (
          <div className="empty-state">No reviews waiting for approval.</div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pending.map((review) => (
              <div key={review.id} className="panel" style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{review.authorName ?? 'Anonymous'}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>on {review.tour.title}</span>
                    <p style={{ color: 'var(--gold-dark)', fontSize: '1rem', letterSpacing: '0.05em', marginTop: '0.2rem' }}>{stars(review.rating)}</p>
                  </div>
                  <form action={`/api/admin/reviews/${review.id}/approve`} method="post">
                    <button type="submit" className="button small">✓ Approve</button>
                  </form>
                </div>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text)' }}>{review.body}</p>
                <p style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>
                  Submitted {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <div>
        <h2 style={{ marginBottom: '1rem' }}>Approved reviews</h2>
        {approved.length === 0 ? (
          <div className="empty-state">No approved reviews yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Tour</th>
                  <th>Rating</th>
                  <th>Date</th>
                  <th>Excerpt</th>
                </tr>
              </thead>
              <tbody>
                {approved.map((review) => (
                  <tr key={review.id}>
                    <td>{review.authorName ?? '—'}</td>
                    <td>{review.tour.title}</td>
                    <td style={{ color: 'var(--gold-dark)' }}>{stars(review.rating)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {review.submittedAt ? new Date(review.submittedAt).toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td style={{ fontSize: '0.83rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {review.body?.slice(0, 100)}{review.body && review.body.length > 100 ? '…' : ''}
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
