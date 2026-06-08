import { prisma } from '@/lib/prisma';

type ReviewWidgetProps = { tourId: string };

export async function ReviewWidget({ tourId }: ReviewWidgetProps) {
  const reviews = await prisma.review.findMany({
    where: { tourId, approved: true, rating: { not: null } },
    orderBy: { submittedAt: 'desc' },
    take: 6,
    select: { id: true, rating: true, body: true, authorName: true, submittedAt: true },
  });

  if (reviews.length === 0) return null;

  const avg = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length;
  const stars = (n: number) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));

  return (
    <section style={{ marginTop: '3rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <h2>Traveller reviews</h2>
        <span style={{ color: 'var(--gold-dark)', fontSize: '1.1rem', letterSpacing: '0.04em' }}>{stars(avg)}</span>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
        {reviews.map((review) => (
          <div key={review.id} className="panel" style={{ display: 'grid', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.88rem' }}>{review.authorName ?? 'Traveller'}</strong>
              <span style={{ color: 'var(--gold-dark)', fontSize: '0.9rem' }}>{stars(review.rating ?? 0)}</span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: 'var(--muted)' }}>{review.body}</p>
            {review.submittedAt && (
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                {new Date(review.submittedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
