import { prisma } from '@/lib/prisma';

export async function ReviewWidget({ tourId }: { tourId: string }) {
  const reviews = await prisma.review.findMany({
    where: { tourId, approved: true, rating: { not: null } },
    orderBy: { submittedAt: 'desc' }, take: 6,
    select: { id: true, rating: true, body: true, authorName: true, submittedAt: true },
  });
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length;
  const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  return (
    <section style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid rgba(13,31,45,0.07)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.85rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <h2>Traveller reviews</h2>
        <span style={{ color: 'var(--sienna)', fontSize: '1rem', letterSpacing: '0.04em' }}>{stars(avg)}</span>
        <span style={{ fontSize: '0.78rem', color: 'var(--mist)' }}>{avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}</span>
      </div>
      <div className="grid-3">
        {reviews.map(review => (
          <div key={review.id} className="review-card">
            <div className="review-stars">{stars(review.rating ?? 0)}</div>
            <p className="review-body">"{review.body}"</p>
            <div>
              <div className="review-author">{review.authorName ?? 'Traveller'}</div>
              {review.submittedAt && (
                <div style={{ fontSize: '0.7rem', color: 'rgba(13,31,45,0.3)', marginTop: '0.2rem' }}>
                  {new Date(review.submittedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
