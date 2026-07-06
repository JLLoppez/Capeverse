import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';
import type { CapeEvent } from '@/lib/events';

export function EventCard({ event }: { event: CapeEvent }) {
  const dateLabel = new Date(event.date + 'T00:00:00').toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short',
  });
  return (
    <Link href={`/events/${event.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="card">
        <div className="card-image-wrap">
          <img src={event.imageUrl} alt={event.title} className="card-image" />
          <span className="card-region-badge">{event.category}</span>
          <div className="event-date-chip">
            <CalendarDays size={12} />{dateLabel}
          </div>
          <FavoriteButton
            item={{ type: 'event', id: event.id, title: event.title, slug: event.slug, image: event.imageUrl, subtitle: event.venue }}
          />
        </div>
        <div className="card-body">
          <div className="card-title" style={{ fontSize: '1.05rem' }}>{event.title}</div>
          <p className="card-desc" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <MapPin size={12} style={{ flexShrink: 0 }} />{event.venue} · {event.time}
          </p>
          <div className="card-footer">
            <span className="pill">{event.priceFrom ? `From R ${event.priceFrom}` : 'Free entry'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
