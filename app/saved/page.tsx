'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';
import { getFavorites, toggleFavorite, FavoriteItem } from '@/lib/favorites';

const typeToPath: Record<FavoriteItem['type'], string> = {
  tour: '/tours',
  attraction: '/attractions',
  event: '/events',
};

export default function SavedPage() {
  const [items, setItems] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    const load = () => setItems(getFavorites());
    load();
    window.addEventListener('capeverse-favorites-changed', load);
    return () => window.removeEventListener('capeverse-favorites-changed', load);
  }, []);

  return (
    <section className="section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="section-eyebrow" style={{ justifyContent: 'center' }}>Your list</div>
          <h1 style={{ marginTop: '0.75rem' }}>Saved & shared <em>favorites</em></h1>
          <p className="lead" style={{ maxWidth: 560, margin: '0.85rem auto 0' }}>
            Tap the heart on any tour, attraction, or event to build your own shortlist — it's saved right on this device.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="empty-state">
            <Heart size={28} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p>Nothing saved yet. Browse <Link href="/tours">tours</Link>, <Link href="/attractions">attractions</Link>, or <Link href="/events">events</Link> and tap the heart icon.</p>
          </div>
        ) : (
          <div className="grid-3">
            {items.map(item => (
              <Link key={`${item.type}-${item.id}`} href={`${typeToPath[item.type]}/${item.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div className="card">
                  <div className="card-image-wrap">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="card-image" />
                    ) : (
                      <div className="card-image" style={{ background: 'var(--ink)' }} />
                    )}
                    <span className="card-region-badge">{item.type}</span>
                    <button
                      className="fav-btn"
                      data-active="true"
                      aria-label="Remove from saved"
                      onClick={(e) => { e.preventDefault(); toggleFavorite(item); }}
                    >
                      <Heart size={15} fill="currentColor" />
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="card-title" style={{ fontSize: '1.05rem' }}>{item.title}</div>
                    <p className="card-desc">{item.subtitle}</p>
                    <div className="card-footer">
                      <span className="btn btn-outline btn-sm" style={{ gap: '0.3rem' }}>View <ArrowRight size={13} /></span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
