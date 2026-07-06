import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FavoriteButton } from './FavoriteButton';

type Tour = {
  id: string; title: string; slug: string; summary: string;
  durationType: string; priceFrom: any; category: string; imageUrl: string | null;
};

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link href={`/tours/${tour.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="card">
        <div className="card-image-wrap">
          {tour.imageUrl ? (
            <img src={tour.imageUrl} alt={tour.title} className="card-image" />
          ) : (
            <div className="card-image" style={{ background: 'var(--ink)', display: 'grid', placeItems: 'center' }}>
              <span style={{ fontSize: '2.5rem', opacity: 0.25 }}>🗺</span>
            </div>
          )}
          <span className="card-region-badge">{tour.category}</span>
          <FavoriteButton
            item={{ type: 'tour', id: tour.id, title: tour.title, slug: tour.slug, image: tour.imageUrl, subtitle: tour.summary }}
          />
          <span style={{
            position: 'absolute', bottom: '0.9rem', right: '0.9rem',
            fontSize: '0.66rem', fontWeight: 500, color: 'rgba(255,255,255,0.8)',
            background: 'rgba(13,31,45,0.6)', backdropFilter: 'blur(8px)',
            padding: '0.22rem 0.65rem', borderRadius: 999,
          }}>{tour.durationType}</span>
        </div>
        <div className="card-body">
          <div className="card-label">{tour.category}</div>
          <div className="card-title">{tour.title}</div>
          <p className="card-desc">{tour.summary}</p>
          <div className="card-footer">
            <div className="card-price">
              <span>from</span>R {Number(tour.priceFrom).toLocaleString()}
            </div>
            <span className="btn btn-outline btn-sm" style={{ gap: '0.3rem' }}>
              View <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
