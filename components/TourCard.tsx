import Link from 'next/link';
import { Decimal } from '@prisma/client/runtime/library';

type Tour = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  durationType: string;
  priceFrom: Decimal;
  category: string;
  imageUrl: string | null;
};

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <div className="card">
      {tour.imageUrl ? (
        <img src={tour.imageUrl} alt={tour.title} className="card-image" />
      ) : (
        <div className="card-image" style={{background:'linear-gradient(135deg,var(--brand-dark),var(--brand))',display:'grid',placeItems:'center'}}>
          <span style={{color:'rgba(255,255,255,0.4)',fontSize:'2rem'}}>🗺️</span>
        </div>
      )}
      <div className="card-body">
        <div>
          <span style={{display:'inline-flex',alignItems:'center',padding:'0.25rem 0.65rem',borderRadius:'999px',fontSize:'0.75rem',fontWeight:600,background:'rgba(10,102,72,0.08)',color:'var(--brand)',border:'1px solid rgba(10,102,72,0.12)'}}>
            {tour.category}
          </span>
        </div>
        <h3 style={{margin:'0.5rem 0 0.35rem'}}>{tour.title}</h3>
        <p style={{color:'var(--muted)',fontSize:'0.88rem',margin:0}}>{tour.summary}</p>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'0.75rem',paddingTop:'0.75rem',borderTop:'1px solid var(--line)'}}>
          <span style={{fontSize:'0.85rem',color:'var(--muted)'}}>{tour.durationType}</span>
          <span style={{fontWeight:700,fontSize:'0.95rem'}}>R {Number(tour.priceFrom).toLocaleString()}</span>
        </div>
        <Link href={`/tours/${tour.slug}`} className="button" style={{marginTop:'0.75rem',width:'100%'}}>View tour</Link>
      </div>
    </div>
  );
}
