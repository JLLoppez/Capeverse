import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { currency } from '@/lib/utils';

export default async function AttractionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const attraction = await prisma.attraction.findUnique({ where: { slug } });
  if (!attraction) notFound();

  const tags = Array.isArray(attraction.tags) ? (attraction.tags as string[]) : [];

  return (
    <section className="section">
      <div className="container detail-grid">
        <div>
          <span className="eyebrow">{attraction.region}</span>
          <h1>{attraction.name}</h1>
          <p className="lead">{attraction.fullDescription}</p>
          <div className="pill-row">
            <span className="pill">{Math.round(attraction.estimatedVisitMinutes / 60)}+ hours</span>
            <span className="pill">
              Entrance {attraction.entranceFee ? currency(Number(attraction.entranceFee)) : 'Free'}
            </span>
          </div>
          <div className="panel section-stack">
            <h2>Best for</h2>
            <div className="pill-row">
              {tags.map((tag) => (
                <span key={tag} className="pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="cta-row">
            <Link href="/plan-trip" className="button">
              Add to itinerary builder
            </Link>
            <Link href="/enquiry" className="button outline">
              Request a custom quote
            </Link>
          </div>
        </div>
        <aside>{attraction.imageUrl ? <img src={attraction.imageUrl} alt={attraction.name} className="detail-image" /> : null}</aside>
      </div>
    </section>
  );
}
