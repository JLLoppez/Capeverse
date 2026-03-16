'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Map, MapPin, Calendar, Bot, MessageCircle, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/tours', label: 'Tours', icon: Map },
  { href: '/attractions', label: 'Attractions', icon: MapPin },
  { href: '/plan-trip', label: 'Plan My Trip', icon: Calendar },
  { href: '/ai-assistant', label: 'AI Assistant', icon: Bot },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <div className="topbar">
          <div className="container topbar-inner">
            <span className="topbar-text-desktop">Private Cape Town tours · AI itinerary planning · Local expert follow-up</span>
            <span className="topbar-text-mobile">Private Cape Town tours · AI planning</span>
            <a href="/enquiry" style={{whiteSpace:'nowrap'}}>Get a quote →</a>
          </div>
        </div>
        <div className="container nav-row">
          <Link href="/" className="brand-wrap" onClick={() => setOpen(false)}>
            <span className="brand-mark">CV</span>
            <div>
              <span className="brand">Capiverse</span>
              <span className="brand-sub">The universe of Cape Town</span>
            </div>
          </Link>
          <nav className="desktop-nav">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="nav-link">
                <Icon size={14} />{label}
              </Link>
            ))}
            <Link href="/enquiry" className="button small glow-button">
              <MessageCircle size={13} />Enquire
            </Link>
          </nav>
          <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>
      {open && (
        <div className="mobile-drawer" onClick={() => setOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span style={{fontWeight:700,color:'var(--brand)'}}>Capiverse</span>
              <button onClick={() => setOpen(false)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',display:'flex'}}>
                <X size={20}/>
              </button>
            </div>
            <div style={{flex:1}}>
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="mobile-nav-item" onClick={() => setOpen(false)}>
                  <span className="mobile-nav-icon"><Icon size={16}/></span>{label}
                </Link>
              ))}
            </div>
            <div style={{padding:'1.25rem',borderTop:'1px solid var(--line)'}}>
              <Link href="/enquiry" className="button" onClick={() => setOpen(false)}
                style={{width:'100%',justifyContent:'center',display:'flex',gap:'0.4rem'}}>
                <MessageCircle size={15}/>Enquire now
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
