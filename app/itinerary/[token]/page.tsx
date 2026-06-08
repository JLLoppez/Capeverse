import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

type Stop = { name: string; region: string; reason?: string };
type DayResult = { day: number; title: string; stops: Stop[] };
type ItineraryResult = {
  summary: string;
  recommendedTourType: string;
  estimatedPriceBand: string;
  days: DayResult[];
  warnings?: string[];
  droppedAttractions?: string[];
};

export default async function SharedItineraryPage({
  params,
}: {
  params: { token: string };
}) {
  const saved = await prisma.savedItinerary.findUnique({
    where: { token: params.token },
  });

  if (!saved) notFound();
  if (saved.expiresAt < new Date()) {
    return (
      <section className="section">
        <div className="container narrow" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <span className="eyebrow">Expired</span>
          <h1 style={{ marginTop: '1rem', marginBottom: '1rem' }}>This itinerary link has expired</h1>
          <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
            Itinerary links are valid for 90 days. Head back to the planner to generate a new one.
          </p>
          <Link href="/plan-trip" className="button">Build a new itinerary</Link>
        </div>
      </section>
    );
  }

  const result = saved.itineraryJson as ItineraryResult;
  const interests = saved.interests as string[];

  return (
    <>
      <section style={{ background: 'var(--brand-dark)', padding: '4.5rem 0 3.5rem' }}>
        <div className="container narrow">
          <span className="eyebrow" style={{ color: 'var(--gold)' }}>Saved itinerary</span>
          <h1 style={{ color: '#fff', marginTop: '0.75rem', marginBottom: '1rem' }}>
            Your Cape Town trip plan
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {[
              `${saved.days} day${saved.days > 1 ? 's' : ''}`,
              saved.groupType,
              saved.budget,
              saved.pace,
              ...interests,
            ].map((chip) => (
              <span key={chip} className="trust-chip">{chip}</span>
            ))}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.7)', maxWidth: '560px' }}>{result.summary}</p>
        </div>
      </section>

      <section className="section">
        <div className="container narrow">
          <div className="pill-row" style={{ marginBottom: '2rem' }}>
            <span className="pill">{result.recommendedTourType}</span>
            <span className="pill">{result.estimatedPriceBand}</span>
          </div>

          {result.warnings && result.warnings.length > 0 && (
            <div style={{
              background: 'rgba(255,180,0,0.08)', border: '1px solid rgba(255,180,0,0.3)',
              borderRadius: 'var(--radius)', padding: '0.85rem 1rem', marginBottom: '1.5rem',
            }}>
              {result.warnings.map((w, i) => (
                <p key={i} style={{ fontSize: '0.85rem', margin: i > 0 ? '0.4rem 0 0' : 0 }}>⚠ {w}</p>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2.5rem' }}>
            {result.days.map((day) => (
              <div key={day.day} className="panel">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em',
                    color: 'var(--brand)', textTransform: 'uppercase',
                  }}>Day {day.day}</span>
                  <h3 style={{ margin: 0 }}>{day.title}</h3>
                </div>
                <ul style={{ display: 'grid', gap: '0.65rem', paddingLeft: 0, listStyle: 'none' }}>
                  {day.stops.map((stop) => (
                    <li key={`${day.day}-${stop.name}`} style={{
                      padding: '0.75rem', background: 'var(--bg)',
                      borderRadius: 'var(--radius)', border: '1px solid var(--line)',
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{stop.name}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}> · {stop.region}</span>
                      {stop.reason && (
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: '0.2rem 0 0' }}>
                          {stop.reason}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* WhatsApp + enquiry CTAs */}
          <div style={{
            background: 'linear-gradient(135deg,var(--brand),var(--brand-dark))',
            borderRadius: 'var(--radius-xl)', padding: '2.5rem',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem',
          }}>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '0.4rem' }}>Ready to make this happen?</h3>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: '0.88rem' }}>
                Send this plan to a consultant — we'll refine the timing and get it booked.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Hi! I've planned a Cape Town trip and would love some help finalising it. Here's my itinerary: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="button"
                style={{ background: '#25D366', boxShadow: 'none' }}
              >
                💬 WhatsApp
              </a>
              <Link
                href={`/enquiry?itinerary=${params.token}`}
                className="button"
                style={{ background: '#fff', color: 'var(--brand-dark)', boxShadow: 'none', fontWeight: 700 }}
              >
                Enquire now
              </Link>
            </div>
          </div>

          <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '1.5rem', textAlign: 'center' }}>
            This link is valid until {new Date(saved.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>
      </section>
    </>
  );
}
