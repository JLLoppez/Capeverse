import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { currency } from '@/lib/utils';
import { ReviewWidget } from '@/components/ReviewWidget';
import { FunnelTracker } from '@/components/FunnelTracker';
import { WhatsAppButton } from '@/components/WhatsAppButton';

export default async function TourDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = await prisma.tour.findUnique({
    where: { slug, isActive: true },
    include: {
      stops: {
        include: { attraction: true },
        orderBy: { stopOrder: 'asc' },
      },
    },
  });

  if (!tour) notFound();

  const highlights = Array.isArray(tour.highlights) ? (tour.highlights as string[]) : [];

  return (
    <>
      {/* Fire funnel event server-side isn't possible; FunnelTracker is a client component */}
      <FunnelTracker event="viewed_tour" meta={{ tourId: tour.id, slug: tour.slug }} />

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
                    {stop.suggestedStopMinutes && (
                      <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                        {' '}· ~{stop.suggestedStopMinutes} min
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <div className="cta-row">
              <Link href="/enquiry" className="button">Enquire now</Link>
              <WhatsAppButton
                phone={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}
                message={`Hi! I'm interested in the ${tour.title} tour and would love more details.`}
                label="Ask on WhatsApp"
              />
              <Link href="/plan-trip" className="button outline">Add to custom plan</Link>
            </div>
          </div>

          <aside>
            {tour.imageUrl ? (
              <img src={tour.imageUrl} alt={tour.title} className="detail-image" />
            ) : null}
            <div className="panel section-stack">
              <h3>Why guests choose this tour</h3>
              <p>Ideal for travellers who want a polished private experience with smart routing and flexible pacing.</p>
            </div>
          </aside>
        </div>

        {/* Reviews — wired in, shown only when approved reviews exist */}
        <div className="container">
          <ReviewWidget tourId={tour.id} />
        </div>
      </section>
    </>
  );
}
