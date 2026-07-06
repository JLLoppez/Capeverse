/**
 * Events registry — powers the "Find events near you" feature shown in the
 * marketing brand kit but previously missing from the platform.
 *
 * This starts as static data (no migration required) so it ships immediately.
 * To move it to the database: add an `Event` model to prisma/schema.prisma
 * mirroring this shape, seed it, and swap these helpers for prisma calls.
 */

export type CapeEvent = {
  id: string;
  slug: string;
  title: string;
  category: 'Music' | 'Festival' | 'Sport' | 'Market' | 'Culture';
  venue: string;
  date: string;       // ISO date
  time: string;        // display string, e.g. "10:00 AM"
  priceFrom: number | null; // null = free
  imageUrl: string;
  summary: string;
};

export const EVENTS: CapeEvent[] = [
  {
    id: 'evt-jazz-festival',
    slug: 'cape-town-jazz-festival',
    title: 'Cape Town International Jazz Festival',
    category: 'Music',
    venue: 'Cape Town International Convention Centre',
    date: '2026-07-12',
    time: '10:00 AM',
    priceFrom: 950,
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    summary: 'Africa\'s grandest gathering — two nights of jazz across five stages in the city centre.',
  },
  {
    id: 'evt-sunset-sounds',
    slug: 'sunset-sounds-clifton-beach',
    title: 'Sunset Sounds — Clifton Beach',
    category: 'Music',
    venue: 'Clifton 4th Beach',
    date: '2026-07-12',
    time: '6:00 PM',
    priceFrom: null,
    imageUrl: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?auto=format&fit=crop&w=1200&q=80',
    summary: 'A free beachfront sunset session with local DJs — bring a blanket and watch the sky turn pink.',
  },
  {
    id: 'evt-food-market',
    slug: 'old-biscuit-mill-market',
    title: 'Old Biscuit Mill Saturday Market',
    category: 'Market',
    venue: 'Woodstock',
    date: '2026-07-05',
    time: '9:00 AM',
    priceFrom: null,
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80',
    summary: 'Cape Town\'s best-loved weekly food and design market — an easy morning stop before the Waterfront.',
  },
  {
    id: 'evt-heritage-walk',
    slug: 'bokaap-heritage-walk',
    title: 'Bo-Kaap Heritage Walking Tour',
    category: 'Culture',
    venue: 'Bo-Kaap',
    date: '2026-07-18',
    time: '11:00 AM',
    priceFrom: 350,
    imageUrl: 'https://images.unsplash.com/photo-1591024676666-90bb0947a005?auto=format&fit=crop&w=1200&q=80',
    summary: 'A guided walk through the cobbled, colourful streets of one of Cape Town\'s oldest neighbourhoods.',
  },
  {
    id: 'evt-cycle-tour',
    slug: 'cape-town-cycle-tour',
    title: 'Cape Town Cycle Tour',
    category: 'Sport',
    venue: 'City Bowl to Chapman\'s Peak',
    date: '2026-08-09',
    time: '7:00 AM',
    priceFrom: 650,
    imageUrl: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1200&q=80',
    summary: 'One of the world\'s largest timed cycle races, looping the Cape Peninsula\'s most scenic roads.',
  },
];

export function getUpcomingEvents(): CapeEvent[] {
  return [...EVENTS].sort((a, b) => a.date.localeCompare(b.date));
}

export function getEventBySlug(slug: string): CapeEvent | undefined {
  return EVENTS.find(e => e.slug === slug);
}
