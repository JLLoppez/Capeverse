import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { currency } from '@/lib/utils';

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = await prisma.tour.findUnique({
    where: { slug },
    include: {
      stops: {
        include: { attraction: true },
        orderBy: { stopOrder: 'asc' }
      },
      availability: {
        where: { blockedDate: { gte: new Date() } },
        orderBy: { blockedDate: 'asc' },
        take: 6,
      }
    }
  });

  if (!tour) notFound();

  const highlights = Array.isArray(tour.highlights) ? (tour.highlights as string[]) : [];
  const zarPrice = Number(tour.priceFrom);
  const approxEur = Math.round(zarPrice * 0.050);
  const approxGbp = Math.round(zarPrice * 0.043);

  return (
    <section className="section">
      <div className="container detail-grid">
        <div>
          <span className="eyebrow">{tour.category}</span>
          <h1>{tour.title}</h1>
          <p className="lead">{tour.description}</p>
          <div className="pill-row">
            <span className="pill">{tour.durationType}</span>
            <span className="pill">From {currency(zarPrice)}</span>
            <span className="pill">{tour.isPrivate ? 'Private tour' : 'Shared tour'}</span>
          </div>

          {/* Multi-currency price hint */}
          <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1.1rem', background: 'rgba(14,77,100,0.05)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px solid rgba(14,77,100,0.1)' }}>
            <strong>Price guide:</strong> From {currency(zarPrice)} per person &nbsp;·&nbsp;
            ≈ €{approxEur.toLocaleString()} &nbsp;·&nbsp; ≈ £{approxGbp.toLocaleString()}
            <span style={{ display: 'block', fontSize: '0.72rem', marginTop: '0.25rem', color: 'var(--text-faint)' }}>
              Approximate conversions — final invoice in ZAR at time of booking.
            </span>
          </div>

          <div className="panel section-stack">
            <h2>Highlights</h2>
            <ul>
              {highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="panel section-stack">
            <h2>Suggested route</h2>
            <ol>
              {tour.stops.map((stop) => (
                <li key={stop.id}>
                  <strong>{stop.attraction.name}</strong> — {stop.attraction.region}
                </li>
              ))}
            </ol>
          </div>

          {/* Upcoming blocked dates warning */}
          {tour.availability.length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '0.85rem 1.1rem', background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '10px', fontSize: '0.85rem' }}>
              <strong style={{ color: '#dc2626' }}>Limited availability:</strong> Some upcoming dates are fully booked.
              Please contact us to confirm your preferred date before booking.
            </div>
          )}

          <div className="cta-row">
            <Link href="/enquiry" className="button">
              Enquire now
            </Link>
            <Link href="/plan-trip" className="button outline">
              Add to custom plan
            </Link>
          </div>
        </div>
        <aside>
          {tour.imageUrl ? <img src={tour.imageUrl} alt={tour.title} className="detail-image" /> : null}
          <div className="panel section-stack">
            <h3>Why guests choose this tour</h3>
            <p>Ideal for travellers who want a polished private experience with smart routing and flexible pacing.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
