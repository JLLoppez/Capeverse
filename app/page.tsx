import Link from 'next/link';
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { prisma } from '@/lib/prisma';
import { TourCard } from '@/components/TourCard';
import { AttractionCard } from '@/components/AttractionCard';

export default async function HomePage() {
  const [featuredTours, attractions] = await Promise.all([
    prisma.tour.findMany({ where: { isActive: true, isFeatured: true }, orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.attraction.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 4 })
  ]);

  return (
    <>
      {/* HERO */}
      <section className="hero-full">
        <img
          src="https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80"
          alt="Cape Town aerial view"
          className="hero-bg"
        />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="container">
            <span className="eyebrow">Cape Town Tour Platform</span>
            <h1>Plan a Cape Town trip that feels custom from the very first click.</h1>
            <p className="lead">Private tours, AI itinerary planning, and a real consultant ready to turn your ideas into a polished trip.</p>
            <div className="cta-row">
              <Link href="/tours" className="button glow-button">Explore tours</Link>
              <Link href="/plan-trip" className="button light-outline">Build itinerary</Link>
            </div>
            <div className="hero-trust-row">
              {['AI itinerary generation','Private-first tours','Local expert follow-up'].map((point) => (
                <span key={point} className="trust-chip">{point}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div className="stats-bar">
        <div className="container">
          <div className="stats-row">
            {[
              {value:'Private-first', label:'Tour design style'},
              {value:'AI + Human', label:'Planning workflow'},
              {value:'Cape Town', label:'Destination focus'},
              {value:'Full stack', label:'Platform included'},
            ].map((item) => (
              <div key={item.label} className="stat-item">
                <div className="stat-value">{item.value}</div>
                <div className="stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED TOURS */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Featured tours</span>
              <h2>Ready-to-sell signature experiences</h2>
            </div>
            <Link href="/tours">See all tours →</Link>
          </div>
          <div className="grid-three">
            {featuredTours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </div>
      </section>

      {/* ATTRACTIONS */}
      <section className="section tinted">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Top attractions</span>
              <h2>Let travellers build around the places they already love</h2>
            </div>
            <Link href="/attractions">Browse all →</Link>
          </div>
          <div className="grid-four">
            {attractions.map((attraction) => (
              <AttractionCard key={attraction.id} attraction={attraction} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <div style={{textAlign:'center',marginBottom:'3rem'}}>
            <span className="eyebrow">How it works</span>
            <h2 style={{marginTop:'0.5rem'}}>From interest to itinerary in three steps</h2>
          </div>
          <div className="three-up">
            {[
              {step:'01', title:'Select must-see places', desc:'Guests pick Cape Point, Table Mountain, Bo-Kaap, Winelands, penguins, beaches, and more.'},
              {step:'02', title:'Auto-generate an itinerary', desc:'The planner groups nearby highlights into realistic days, accounting for budget, pace, and group type.'},
              {step:'03', title:'Convert interest into enquiries', desc:'Admin receives the lead immediately — email notifications alert both your team and the traveller.'},
            ].map((item) => (
              <div key={item.step} className="feature-box premium-box">
                <div style={{fontSize:'0.72rem',fontWeight:800,letterSpacing:'0.1em',color:'var(--brand)',marginBottom:'0.75rem'}}>{item.step}</div>
                <h3 style={{marginBottom:'0.6rem'}}>{item.title}</h3>
                <p style={{color:'var(--muted)',fontSize:'0.92rem'}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI SECTION */}
      <section className="section" style={{background:'var(--brand-dark)'}}>
        <div className="container">
          <div className="grid-two align-start">
            <div>
              <span className="eyebrow" style={{color:'var(--gold)'}}>AI trip assistant</span>
              <h2 style={{color:'#fff',marginTop:'0.5rem',marginBottom:'1rem'}}>Guide uncertain travellers toward the best-fit experience.</h2>
              <p style={{color:'rgba(255,255,255,0.65)',marginBottom:'1.75rem'}}>The AI assistant asks simple questions around trip length, interests, and pace, then points the visitor toward the strongest route — or to a real consultant when the request gets more custom.</p>
              <Link href="/ai-assistant" className="button glow-button">Try the assistant</Link>
            </div>
            <div className="stack-cards">
              {[
                {quote:'The platform made it easy to mix scenic routes, penguins, and Winelands without building an unrealistic day.', author:'Travel Planner Demo'},
                {quote:'We could capture the lead, the AI summary, and the client preferences in one place for quick follow-up.', author:'Operations Team Demo'},
              ].map((item) => (
                <div key={item.author} className="glass-card quote-card">
                  <p>"{item.quote}"</p>
                  <strong>{item.author}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="section">
        <div className="container">
          <div style={{background:'linear-gradient(135deg,var(--brand),var(--brand-dark))',borderRadius:'var(--radius-xl)',padding:'3rem 2.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1.5rem'}}>
            <div>
              <h2 style={{color:'#fff',marginBottom:'0.5rem'}}>Ready to take enquiries?</h2>
              <p style={{color:'rgba(255,255,255,0.7)',margin:0}}>Start with a live demo or send your first enquiry now.</p>
            </div>
            <Link href="/enquiry" className="button" style={{background:'#fff',color:'var(--brand-dark)',boxShadow:'none',fontWeight:700}}>Enquire now</Link>
          </div>
        </div>
      </section>
    </>
  );
}
