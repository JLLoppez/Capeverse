import { getUpcomingEvents } from '@/lib/events';
import { EventCard } from '@/components/EventCard';

export const metadata = { title: 'Events in Cape Town — Capeverse' };

export default function EventsPage() {
  const events = getUpcomingEvents();
  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>What's on</div>
          <h1 style={{ marginTop: '0.75rem' }}>Find events near <em>you</em></h1>
          <p className="lead" style={{ maxWidth: 560, margin: '0.85rem auto 0' }}>
            Festivals, markets, and local happenings — layer these into your itinerary alongside your tours.
          </p>
        </div>
        <div className="grid-3">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      </div>
    </section>
  );
}
