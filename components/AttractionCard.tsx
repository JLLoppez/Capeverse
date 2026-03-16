import Link from 'next/link';
import { Decimal } from '@prisma/client/runtime/library';

type Attraction = {
  id: string;
  name: string;
  slug: string;
  region: string;
  shortDescription: string;
  imageUrl: string | null;
  entranceFee: Decimal | null;
};

export function AttractionCard({ attraction }: { attraction: Attraction }) {
  return (
    <div className="card">
      {attraction.imageUrl ? (
        <img src={attraction.imageUrl} alt={attraction.name} className="card-image" />
      ) : (
        <div className="card-image" style={{background:'linear-gradient(135deg,#e8f5f0,#d0ebe3)',display:'grid',placeItems:'center'}}>
          <span style={{fontSize:'2rem'}}>📍</span>
        </div>
      )}
      <div className="card-body">
        <div>
          <span style={{display:'inline-flex',alignItems:'center',padding:'0.25rem 0.65rem',borderRadius:'999px',fontSize:'0.75rem',fontWeight:600,background:'rgba(10,102,72,0.08)',color:'var(--brand)',border:'1px solid rgba(10,102,72,0.12)'}}>
            {attraction.region}
          </span>
        </div>
        <h3 style={{margin:'0.5rem 0 0.35rem'}}>{attraction.name}</h3>
        <p style={{color:'var(--muted)',fontSize:'0.88rem',margin:0}}>{attraction.shortDescription}</p>
        <Link href={`/attractions/${attraction.slug}`} className="button" style={{marginTop:'0.75rem',width:'100%'}}>View attraction</Link>
      </div>
    </div>
  );
}
