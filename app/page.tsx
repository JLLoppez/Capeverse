import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TourCard } from '@/components/TourCard';
import { AttractionCard } from '@/components/AttractionCard';
import { Compass, Bot, Mountain, Zap, MapPin, Calendar, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default async function HomePage() {
  const [featuredTours, attractions] = await Promise.all([
    prisma.tour.findMany({ where: { isActive: true, isFeatured: true }, orderBy: { createdAt: 'desc' }, take: 3 }),
    prisma.attraction.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' }, take: 4 })
  ]);
  return (
    <>
      <section className="hero-full">
        <img src="https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80" alt="Cape Town" className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="container">
            <span className="eyebrow">Discover Cape Town Differently</span>
            <h1>The universe of Cape Town experiences, in one platform.</h1>
            <p className="lead">Private tours, AI itinerary planning, and a real consultant ready to turn your ideas into a polished trip.</p>
            <div className="cta-row">
              <Link href="/tours" className="button glow-button"><Compass size={16}/>Explore tours</Link>
              <Link href="/plan-trip" className="button light-outline"><Sparkles size={16}/>Build itinerary</Link>
            </div>
            <div className="hero-trust-row">
              {[{icon:<Bot size={13}/>,text:'AI itinerary generation'},{icon:<Compass size={13}/>,text:'Private-first tours'},{icon:<MapPin size={13}/>,text:'Local expert follow-up'}].map((item) => (
                <span key={item.text} className="trust-chip">{item.icon}{item.text}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="container">
          <div className="stats-row">
            {[
              {icon:<Compass size={16}/>,value:'Private-first',label:'Tour design style'},
              {icon:<Bot size={16}/>,value:'AI + Human',label:'Planning workflow'},
              {icon:<Mountain size={16}/>,value:'Cape Town',label:'Destination focus'},
              {icon:<Zap size={16}/>,value:'Full stack',label:'Platform included'},
            ].map((item) => (
              <div key={item.label} className="stat-item">
                <div className="stat-icon">{item.icon}</div>
                <div><div className="stat-value">{item.value}</div><div className="stat-label">{item.label}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div><span className="eyebrow">Featured tours</span><h2>Ready-to-sell signature experiences</h2></div>
            <Link href="/tours" style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>See all <ArrowRight size={14}/></Link>
          </div>
          <div className="grid-three">
            {featuredTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>
        </div>
      </section>

      <section className="section tinted">
        <div className="container">
          <div className="section-header">
            <div><span className="eyebrow">Top attractions</span><h2>Let travellers build around the places they love</h2></div>
            <Link href="/attractions" style={{display:'flex',alignItems:'center',gap:'0.3rem'}}>Browse all <ArrowRight size={14}/></Link>
          </div>
          <div className="grid-four">
            {attractions.map((a) => <AttractionCard key={a.id} attraction={a} />)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{textAlign:'center',marginBottom:'3rem'}}>
            <span className="eyebrow">How it works</span>
            <h2 style={{marginTop:'0.5rem'}}>From interest to itinerary in three steps</h2>
          </div>
          <div className="three-up">
            {[
              {icon:<MapPin size={28}/>,step:'01',title:'Select must-see places',desc:'Guests pick Cape Point, Table Mountain, Bo-Kaap, Winelands, penguins, beaches, and more.'},
              {icon:<Calendar size={28}/>,step:'02',title:'Auto-generate an itinerary',desc:'The planner groups nearby highlights into realistic days, accounting for budget, pace, and group type.'},
              {icon:<Mail size={28}/>,step:'03',title:'Convert interest into enquiries',desc:'Admin receives the lead immediately — email notifications alert both your team and the traveller.'},
            ].map((item) => (
              <div key={item.step} className="feature-box premium-box">
                <div style={{color:'var(--gold)',marginBottom:'0.75rem'}}>{item.icon}</div>
                <div style={{fontSize:'0.68rem',fontWeight:800,letterSpacing:'0.1em',color:'var(--brand)',marginBottom:'0.5rem'}}>{item.step}</div>
                <h3 style={{marginBottom:'0.6rem'}}>{item.title}</h3>
                <p style={{color:'var(--muted)',fontSize:'0.9rem'}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{background:'var(--brand-dark)'}}>
        <div className="container">
          <div className="grid-two align-start">
            <div>
              <span className="eyebrow" style={{color:'var(--gold)'}}>AI trip assistant</span>
              <h2 style={{color:'#fff',marginTop:'0.5rem',marginBottom:'1rem'}}>Guide uncertain travellers toward the best-fit experience.</h2>
              <p style={{color:'rgba(255,255,255,0.65)',marginBottom:'1.75rem',fontSize:'0.95rem'}}>The AI assistant asks simple questions around trip length, interests, and pace, then points the visitor toward the strongest route.</p>
              <Link href="/ai-assistant" className="button glow-button"><Bot size={16}/>Try the assistant</Link>
            </div>
            <div className="stack-cards">
              {[
                {quote:'The platform made it easy to mix scenic routes, penguins, and Winelands without building an unrealistic day.',author:'Travel Planner Demo'},
                {quote:'We could capture the lead, the AI summary, and the client preferences in one place for quick follow-up.',author:'Operations Team Demo'},
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

      <section className="section">
        <div className="container">
          <div style={{background:'linear-gradient(135deg,var(--brand),var(--brand-dark))',borderRadius:'var(--radius-xl)',padding:'3rem 2.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1.5rem'}}>
            <div>
              <h2 style={{color:'#fff',marginBottom:'0.5rem'}}>Ready to explore the universe?</h2>
              <p style={{color:'rgba(255,255,255,0.68)',margin:0,fontSize:'0.95rem'}}>Send your first enquiry and let Capiverse do the rest.</p>
            </div>
            <Link href="/enquiry" className="button" style={{background:'var(--gold)',color:'#fff',fontWeight:700,display:'flex',alignItems:'center',gap:'0.4rem'}}>
              Enquire now <ArrowRight size={15}/>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
