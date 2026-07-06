'use client';
import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { isFavorite, toggleFavorite, FavoriteItem } from '@/lib/favorites';

export function FavoriteButton({ item }: { item: FavoriteItem }) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isFavorite(item.type, item.id));
  }, [item.type, item.id]);

  return (
    <button
      aria-label={saved ? 'Remove from saved' : 'Save for later'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setSaved(toggleFavorite(item));
      }}
      className="fav-btn"
      data-active={saved}
    >
      <Heart size={15} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
