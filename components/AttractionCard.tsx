import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Attraction = {
  id: string; name: string; slug: string; region: string;
  shortDescription: string; imageUrl: string | null; entranceFee: any;
};

export function AttractionCard({ attraction }: { attraction: Attraction }) {
  const free = !attraction.entranceFee || Number(attraction.entranceFee) === 0;
  return (
    <Link href={`/attractions/${attraction.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="card">
        <div className="card-image-wrap">
          {attraction.imageUrl ? (
            <img src={attraction.imageUrl} alt={attraction.name} className="card-image" />
          ) : (
            <div className="card-image" style={{ background: 'var(--ink)', display: 'grid', placeItems: 'center' }}>
              <span style={{ fontSize: '2rem', opacity: 0.25 }}>📍</span>
            </div>
          )}
          <span className="card-region-badge">{attraction.region}</span>
        </div>
        <div className="card-body">
          <div className="card-title" style={{ fontSize: '1.1rem' }}>{attraction.name}</div>
          <p className="card-desc">{attraction.shortDescription}</p>
          <div className="card-footer">
            <span className="pill">{free ? 'Free entry' : `From R ${Number(attraction.entranceFee)}`}</span>
            <ArrowRight size={14} style={{ color: 'var(--sienna)', flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
