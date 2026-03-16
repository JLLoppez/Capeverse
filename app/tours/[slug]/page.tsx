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
      }
    }
  });

  if (!tour) notFound();

  const highlights = Array.isArray(tour.highlights) ? (tour.highlights as string[]) : [];

  return (
    <section className="section">
      <div className="container detail-grid">
        <div>
          <span className="eyebrow">{tour.category}</span>
          <h1>{tour.title}</h1>
          <p className="lead">{tour.description}</p>
          <div className="pill-row">
            <span className="pill">{tour.durationType}</span>
            <span className="pill">From {currency(Number(tour.priceFrom))}</span>
            <span className="pill">{tour.isPrivate ? 'Private tour' : 'Shared tour'}</span>
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
