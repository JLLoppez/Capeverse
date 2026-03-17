import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboardPage() {
  const [tours, attractions, enquiries, recentEnquiries] = await Promise.all([
    prisma.tour.count(),
    prisma.attraction.count(),
    prisma.enquiry.count(),
    prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 6 })
  ]);

  const stats = [
    { label: 'Total tours', value: tours, color: '#0E4D64', bg: 'rgba(14,77,100,0.08)' },
    { label: 'Total attractions', value: attractions, color: '#4F7C5A', bg: 'rgba(79,124,90,0.08)' },
    { label: 'Total enquiries', value: enquiries, color: '#d4853a', bg: 'rgba(242,166,90,0.12)' },
    { label: 'New leads this week', value: recentEnquiries.length, color: '#c0392b', bg: 'rgba(192,57,43,0.08)' },
  ];

  return (
    <div style={{display:'grid',gap:'1.5rem'}}>
      <div>
        <span style={{fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',color:'#d4853a'}}>Admin Dashboard</span>
        <h1 style={{fontSize:'2rem',fontWeight:700,marginTop:'0.25rem',color:'#1F2933'}}>Overview</h1>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'1rem'}}>
        {stats.map((stat) => (
          <div key={stat.label} style={{background:'#fff',border:'1px solid rgba(14,77,100,0.1)',borderRadius:'16px',padding:'1.25rem',borderLeft:`4px solid ${stat.color}`}}>
            <div style={{fontSize:'0.78rem',fontWeight:600,color:'#4a5a63',marginBottom:'0.5rem'}}>{stat.label}</div>
            <div style={{fontSize:'2rem',fontWeight:800,color:stat.color,lineHeight:1}}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{background:'#fff',border:'1px solid rgba(14,77,100,0.1)',borderRadius:'16px',padding:'1.5rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <h2 style={{fontSize:'1.1rem',fontWeight:700,color:'#1F2933'}}>Recent enquiries</h2>
          <Link href="/admin/enquiries" style={{fontSize:'0.82rem',fontWeight:600,color:'#0E4D64',border:'1.5px solid #0E4D64',borderRadius:'999px',padding:'0.4rem 0.85rem'}}>View all</Link>
        </div>
        {recentEnquiries.length === 0 ? (
          <p style={{color:'#4a5a63',fontSize:'0.9rem'}}>No enquiries yet.</p>
        ) : (
          <div style={{display:'grid',gap:'0.75rem'}}>
            {recentEnquiries.map((e) => (
              <Link key={e.id} href={`/admin/enquiries/${e.id}`} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.85rem 1rem',background:'#f7f5f0',borderRadius:'12px',border:'1px solid rgba(14,77,100,0.08)'}}>
                <div>
                  <div style={{fontWeight:600,fontSize:'0.9rem',color:'#1F2933'}}>{e.fullName}</div>
                  <div style={{fontSize:'0.78rem',color:'#4a5a63'}}>{e.email}</div>
                </div>
                <span style={{fontSize:'0.72rem',fontWeight:600,padding:'0.25rem 0.65rem',borderRadius:'999px',background:'rgba(14,77,100,0.08)',color:'#0E4D64'}}>{e.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
