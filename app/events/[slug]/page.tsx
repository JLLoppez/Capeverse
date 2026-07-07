import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, MapPin, Clock } from 'lucide-react';
import { getEventBySlug, getUpcomingEvents } from '@/lib/events';

export function generateStaticParams() {
  return getUpcomingEvents().map(e => ({ slug: e.slug }));
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) return notFound();

  const dateLabel = new Date(event.date + 'T00:00:00').toLocaleDateString('en-ZA', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 820 }}>
        <img src={event.imageUrl} alt={event.title} className="detail-image" />
        <div style={{ marginTop: '1.75rem' }}>
          <span className="badge">{event.category}</span>
          <h1 style={{ margin: '0.85rem 0' }}>{event.title}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--ink-light)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CalendarDays size={16} />{dateLabel}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={16} />{event.time}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={16} />{event.venue}</span>
          </div>
          <p className="lead" style={{ marginBottom: '2rem' }}>{event.summary}</p>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span className="card-price" style={{ display: 'flex', alignItems: 'center' }}>
              {event.priceFrom ? <>R {event.priceFrom}<span>from</span></> : 'Free entry'}
            </span>
            <Link href="/enquiry" className="btn btn-primary btn-lg">Add to my itinerary</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
