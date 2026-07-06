import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { LayoutDashboard, Map, MapPin, MessageCircle, Star, Calendar, ArrowLeft, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard',    href: '/admin',               icon: LayoutDashboard },
  { label: 'Tours',        href: '/admin/tours',         icon: Map },
  { label: 'Attractions',  href: '/admin/attractions',   icon: MapPin },
  { label: 'Enquiries',    href: '/admin/enquiries',     icon: MessageCircle },
  { label: 'Reviews',      href: '/admin/reviews',       icon: Star },
  { label: 'Availability', href: '/admin/availability',  icon: Calendar },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--salt)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ background: 'var(--ink)', color: '#fff', padding: '0.72rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="nav-mark"><img src="/brand/logo-icon.svg" alt="Capeverse" width={22} height={22} /></div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--salt)' }}>
            Capeverse <span style={{ opacity: 0.4, fontSize: '0.78rem', fontFamily: 'var(--font-body)', fontWeight: 400 }}>Admin</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={13} />Back to site
          </Link>
          <form action="/api/admin/logout" method="post" style={{ margin: 0 }}>
            <button style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', padding: '0.3rem 0.85rem', cursor: 'pointer', fontSize: '0.74rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'background 200ms' }}>
              <LogOut size={12} />Logout
            </button>
          </form>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside className="admin-sidebar-desktop" style={{ background: 'var(--ink)', width: 220, flexShrink: 0, padding: '1.25rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' }}>
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} style={{ color: 'rgba(255,255,255,0.6)', padding: '0.6rem 0.85rem', borderRadius: 'var(--r)', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.65rem', transition: 'background 150ms, color 150ms' }}
              onMouseOver={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff'; }}
              onMouseOut={e => { (e.currentTarget as HTMLAnchorElement).style.background = ''; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.6)'; }}
            >
              <Icon size={15} />{label}
            </Link>
          ))}
        </aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {/* Mobile nav */}
          <div className="admin-mobile-nav" style={{ background: '#fff', border: '1px solid rgba(13,31,45,0.08)', borderRadius: 'var(--r-lg)', padding: '0.5rem', marginBottom: '1.5rem', display: 'none', justifyContent: 'space-around', overflowX: 'auto' }}>
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0.5rem 0.75rem', fontSize: '0.62rem', color: 'var(--mist)', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                <Icon size={18} />{label}
              </Link>
            ))}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
