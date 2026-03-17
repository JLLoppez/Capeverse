import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Tour = {
  id: string; title: string; slug: string; summary: string;
  durationType: string; priceFrom: any; category: string; imageUrl: string | null;
};

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link href={`/tours/${tour.slug}`} style={{display:'block',textDecoration:'none'}}>
      <div className="card" style={{cursor:'pointer'}}>
        <div className="card-image-wrap">
          {tour.imageUrl ? (
            <img src={tour.imageUrl} alt={tour.title} className="card-image" style={{width:'100%',height:'240px',objectFit:'cover'}} />
          ) : (
            <div style={{width:'100%',height:'240px',background:'var(--surface-3)',display:'grid',placeItems:'center'}}>
              <span style={{color:'var(--text-faint)',fontSize:'2rem'}}>🗺</span>
            </div>
          )}
        </div>
        <div className="card-body">
          <span className="pill">{tour.category}</span>
          <h3 style={{color:'var(--text)',fontSize:'1.15rem',marginTop:'0.25rem'}}>{tour.title}</h3>
          <p style={{fontSize:'0.85rem',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{tour.summary}</p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'0.75rem',borderTop:'1px solid var(--line)',marginTop:'0.25rem'}}>
            <div>
              <div style={{fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-faint)',marginBottom:'0.2rem'}}>{tour.durationType}</div>
              <div style={{fontSize:'1rem',fontWeight:600,color:'var(--gold)'}}>From R {Number(tour.priceFrom).toLocaleString()}</div>
            </div>
            <ArrowRight size={16} style={{color:'var(--gold)'}} />
          </div>
        </div>
      </div>
    </Link>
  );
}
