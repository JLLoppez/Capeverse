'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Map, MapPin, Calendar, CalendarDays, Bot, MessageCircle, Menu, X, Heart } from 'lucide-react';

const navItems = [
  { href: '/tours',        label: 'Tours',        icon: Map },
  { href: '/attractions',  label: 'Attractions',  icon: MapPin },
  { href: '/events',       label: 'Events',       icon: CalendarDays },
  { href: '/plan-trip',    label: 'Plan my trip', icon: Calendar },
  { href: '/ai-assistant', label: 'AI assistant', icon: Bot },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="site-header">
        <div className="container nav-row">
          <Link href="/" className="nav-logo" onClick={() => setOpen(false)}>
            <div className="nav-mark">
              <img src="/brand/logo-icon.svg" alt="Capeverse" width={22} height={22} />
            </div>
            <div className="nav-wordmark">
              <strong>Capeverse</strong>
              <small>One place. Every experience.</small>
            </div>
          </Link>
          <nav className="desktop-nav">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="nav-link">
                <Icon size={13} />{label}
              </Link>
            ))}
            <Link href="/enquiry" className="btn btn-ink btn-sm" style={{ marginLeft: '0.35rem' }}>
              <MessageCircle size={13} />Enquire
            </Link>
            <Link href="/saved" className="nav-icon-btn" aria-label="Saved">
              <Heart size={17} />
            </Link>
          </nav>
          <div className="nav-mobile-actions">
            <Link href="/saved" className="nav-icon-btn mobile-only" aria-label="Saved">
              <Heart size={18} />
            </Link>
            <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-drawer" onClick={() => setOpen(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="nav-logo">
                <div className="nav-mark">
                  <img src="/brand/logo-icon.svg" alt="Capeverse" width={22} height={22} />
                </div>
                <div className="nav-wordmark">
                  <strong>Capeverse</strong>
                  <small>One place. Every experience.</small>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mist)', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1 }}>
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="mobile-nav-item" onClick={() => setOpen(false)}>
                  <span className="mobile-nav-icon"><Icon size={16} /></span>{label}
                </Link>
              ))}
              <Link href="/saved" className="mobile-nav-item" onClick={() => setOpen(false)}>
                <span className="mobile-nav-icon"><Heart size={16} /></span>Saved
              </Link>
            </div>
            <div style={{ padding: '1.25rem', borderTop: '1px solid rgba(13,31,45,0.07)' }}>
              <Link href="/enquiry" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setOpen(false)}>
                <MessageCircle size={15} />Enquire now
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
