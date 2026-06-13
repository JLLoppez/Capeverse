import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TourCard } from '@/components/TourCard';
import { AttractionCard } from '@/components/AttractionCard';

export default async function HomePage() {
  // Graceful fallback — DB unavailable should never crash the homepage
  let featuredTours:  Awaited<ReturnType<typeof prisma.tour.findMany>>       = [];
  let attractions:    Awaited<ReturnType<typeof prisma.attraction.findMany>>  = [];

  try {
    [featuredTours, attractions] = await Promise.all([
      prisma.tour.findMany({ where: { isActive: true, isFeatured: true }, orderBy: { createdAt: 'desc' }, take: 3 }),
      prisma.attraction.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 4 }),
    ]);
  } catch (err) {
    console.error('[homepage] DB fetch failed:', err);
  }

  return (
    <>
      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="hero-split">
        <div className="hero-left">
          <div className="hero-coord-label reveal">34°02′S 18°25′E · Cape Town, South Africa</div>
          <h1 className="hero-h1 reveal d1">
            Cape Town,<br /><em style={{ color: 'var(--sienna-lt)', fontStyle: 'italic' }}>differently.</em>
          </h1>
          <p className="hero-sub reveal d2">
            Private tours, AI itinerary planning, and a real consultant ready to turn your ideas into a polished trip.
          </p>
          <div className="hero-actions reveal d3">
            <Link href="/tours" className="btn btn-primary btn-lg">Explore tours</Link>
            <Link href="/plan-trip" className="btn btn-ghost">Build itinerary</Link>
          </div>
          <div className="hero-stat-row reveal d4">
            <div className="hero-stat"><strong>Private</strong><span>Tour design</span></div>
            <div className="hero-stat"><strong>AI + Human</strong><span>Planning flow</span></div>
            <div className="hero-stat"><strong>90 days</strong><span>Saved links</span></div>
          </div>
        </div>
        <div className="hero-right">
          <img className="hero-bg-img"
            src="https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80"
            alt="Cape Town aerial view" />
          <div className="hero-bg-overlay" />
          <div className="hero-caption">Table Mountain · 1086m</div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────── */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-row">
            {[
              { value: 'Private-first', label: 'Tour design style' },
              { value: 'AI + Human',    label: 'Planning workflow' },
              { value: 'Cape Town',     label: 'Destination focus' },
              { value: 'Full stack',    label: 'Platform included' },
            ].map(item => (
              <div key={item.label} className="stat-item">
                <div>
                  <div className="stat-value">{item.value}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURED TOURS ──────────────────────────────────── */}
      {featuredTours.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div>
                <div className="section-eyebrow">Featured tours</div>
                <h2>Signature private experiences</h2>
              </div>
              <Link href="/tours">See all tours →</Link>
            </div>
            <div className="grid-3">
              {featuredTours.map(tour => <TourCard key={tour.id} tour={tour} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── ATTRACTIONS ─────────────────────────────────────── */}
      {attractions.length > 0 && (
        <section className="section" style={{ background: 'var(--salt-warm)' }}>
          <div className="container">
            <div className="section-header">
              <div>
                <div className="section-eyebrow">Top attractions</div>
                <h2>Let travellers build around the <em>places they love</em></h2>
              </div>
              <Link href="/attractions">Browse all →</Link>
            </div>
            <div className="grid-4">
              {attractions.map(a => <AttractionCard key={a.id} attraction={a} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="section-eyebrow" style={{ justifyContent: 'center' }}>How it works</div>
            <h2 style={{ marginTop: '0.75rem' }}>From interest to itinerary <em>in three steps</em></h2>
          </div>
          <div className="grid-3">
            {[
              { step: '01', title: 'Select must-see places', desc: 'Guests pick Cape Point, Table Mountain, Bo-Kaap, Winelands, penguins, beaches, and more.' },
              { step: '02', title: 'Auto-generate an itinerary', desc: 'The planner groups nearby highlights into realistic days, accounting for budget, pace, and group type.' },
              { step: '03', title: 'Convert interest into enquiries', desc: 'Admin receives the lead immediately — email notifications alert both your team and the traveller.' },
            ].map(item => (
              <div key={item.step} className="panel">
                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--sienna)', marginBottom: '0.85rem' }}>{item.step}</div>
                <h3 style={{ marginBottom: '0.65rem' }}>{item.title}</h3>
                <p style={{ color: 'rgba(13,31,45,0.55)', fontSize: '0.88rem', fontWeight: 300 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI SECTION ──────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--ink)' }}>
        <div className="container">
          <div className="grid-2 align-start">
            <div>
              <div className="section-eyebrow" style={{ color: 'var(--sienna-lt)' }}>AI trip assistant</div>
              <h2 style={{ color: 'var(--salt)', marginTop: '0.65rem', marginBottom: '1rem' }}>
                Guide uncertain travellers toward the <em style={{ color: 'var(--sienna-lt)' }}>best-fit experience</em>.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', fontWeight: 300, lineHeight: 1.8 }}>
                The AI assistant asks simple questions around trip length, interests, and pace, then builds a geographically-smart itinerary — or routes to a consultant when the request gets more custom.
              </p>
              <Link href="/ai-assistant" className="btn btn-primary">Try the assistant</Link>
            </div>
            <div style={{ display: 'grid', gap: '0.85rem' }}>
              {[
                { quote: 'It correctly grouped Cape Point and Boulders Beach on the same day — I\'d have spread them across two days otherwise.', author: 'Travel Planner Demo' },
                { quote: 'We captured the lead, the AI summary, and the client preferences in one place. Follow-up is effortless now.', author: 'Operations Team Demo' },
              ].map(item => (
                <div key={item.author} className="glass-card">
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: '0.75rem' }}>
                    "{item.quote}"
                  </p>
                  <strong style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.author}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="cta-block-pad" style={{
            background: 'var(--ink)', borderRadius: 'var(--r-xl)', padding: '3.5rem',
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem',
          }}>
            <div>
              <h2 style={{ color: 'var(--salt)', marginBottom: '0.5rem' }}>Ready to take enquiries?</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontWeight: 300 }}>Start with a live demo or send your first enquiry now.</p>
            </div>
            <Link href="/enquiry" className="btn btn-primary btn-lg">Enquire now →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
