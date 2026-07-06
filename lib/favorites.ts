'use client';

export type FavoriteItem = {
  type: 'tour' | 'attraction' | 'event';
  id: string;
  title: string;
  slug: string;
  image: string | null;
  subtitle: string;
};

const KEY = 'capeverse_favorites';

function read(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(items: FavoriteItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('capeverse-favorites-changed'));
}

export function getFavorites(): FavoriteItem[] {
  return read();
}

export function isFavorite(type: FavoriteItem['type'], id: string): boolean {
  return read().some(i => i.type === type && i.id === id);
}

export function toggleFavorite(item: FavoriteItem): boolean {
  const items = read();
  const idx = items.findIndex(i => i.type === item.type && i.id === item.id);
  if (idx >= 0) {
    items.splice(idx, 1);
    write(items);
    return false;
  }
  items.push(item);
  write(items);
  return true;
}
