import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { LayoutDashboard, Map, MapPin, MessageCircle, ArrowLeft, LogOut } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Tours', href: '/admin/tours', icon: Map },
  { label: 'Attractions', href: '/admin/attractions', icon: MapPin },
  { label: 'Enquiries', href: '/admin/enquiries', icon: MessageCircle },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div style={{position:'fixed',inset:0,zIndex:200,background:'#f0f2f0',overflow:'hidden',display:'flex',flexDirection:'column'}}>
      {/* Admin topbar — always visible */}
      <div style={{background:'#082f20',color:'#fff',padding:'0.7rem 1.25rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <span style={{fontWeight:700,fontSize:'0.95rem'}}>Capiverse <span style={{opacity:0.5,fontWeight:400,fontSize:'0.78rem'}}>Admin</span></span>
        <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <Link href="/" style={{color:'rgba(255,255,255,0.55)',fontSize:'0.78rem',display:'flex',alignItems:'center',gap:'0.3rem'}}>
            <ArrowLeft size={13}/>Site
          </Link>
          <form action="/api/admin/logout" method="post" style={{margin:0}}>
            <button style={{background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.8)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:'8px',padding:'0.3rem 0.65rem',cursor:'pointer',fontSize:'0.76rem',fontFamily:'inherit',display:'flex',alignItems:'center',gap:'0.3rem'}}>
              <LogOut size={12}/>Logout
            </button>
          </form>
        </div>
      </div>

      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Sidebar — hidden on mobile */}
        <aside style={{background:'#082f20',color:'#fff',width:'210px',flexShrink:0,padding:'1rem 0.75rem',display:'flex',flexDirection:'column',gap:'0.25rem',overflowY:'auto'}} className="admin-sidebar-desktop">
          {navItems.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href} style={{color:'rgba(255,255,255,0.78)',padding:'0.6rem 0.75rem',borderRadius:'10px',fontSize:'0.87rem',display:'flex',alignItems:'center',gap:'0.6rem',transition:'background 150ms'}}>
              <Icon size={15}/>{label}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main style={{flex:1,overflowY:'auto',padding:'1.75rem'}}>
          {/* Mobile nav tabs */}
          <div className="admin-mobile-nav">
            {navItems.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',padding:'0.5rem',fontSize:'0.68rem',color:'var(--muted)',fontWeight:600}}>
                <Icon size={18}/>{label}
              </Link>
            ))}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
