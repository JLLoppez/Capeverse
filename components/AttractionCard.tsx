import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Attraction = {
  id: string; name: string; slug: string; region: string;
  shortDescription: string; imageUrl: string | null; entranceFee: any;
};

export function AttractionCard({ attraction }: { attraction: Attraction }) {
  return (
    <Link href={`/attractions/${attraction.slug}`} style={{display:'block',textDecoration:'none'}}>
      <div className="card" style={{cursor:'pointer'}}>
        <div className="card-image-wrap">
          {attraction.imageUrl ? (
            <img src={attraction.imageUrl} alt={attraction.name} className="card-image" style={{width:'100%',height:'210px',objectFit:'cover'}} />
          ) : (
            <div style={{width:'100%',height:'210px',background:'var(--surface-3)',display:'grid',placeItems:'center'}}>
              <span style={{color:'var(--text-faint)',fontSize:'2rem'}}>📍</span>
            </div>
          )}
        </div>
        <div className="card-body">
          <span className="pill">{attraction.region}</span>
          <h3 style={{color:'var(--text)',fontSize:'1.1rem'}}>{attraction.name}</h3>
          <p style={{fontSize:'0.82rem',overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{attraction.shortDescription}</p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'0.75rem',borderTop:'1px solid var(--line)',marginTop:'0.25rem'}}>
            <div style={{fontSize:'0.68rem',letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--text-faint)'}}>
              {attraction.entranceFee && Number(attraction.entranceFee) > 0 ? `From R ${Number(attraction.entranceFee)}` : 'Free entry'}
            </div>
            <ArrowRight size={15} style={{color:'var(--gold)'}} />
          </div>
        </div>
      </div>
    </Link>
  );
}
