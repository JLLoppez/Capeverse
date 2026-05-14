/**
 * JSON-LD structured data for tour and attraction pages.
 * Drop <JsonLd data={schema} /> into any page <head> to enable rich results.
 */

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function tourSchema(tour: {
  title: string;
  slug: string;
  summary: string;
  priceFrom: number | string;
  imageUrl?: string | null;
  category: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://capeverse.vercel.app';
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.summary,
    url: `${baseUrl}/tours/${tour.slug}`,
    image: tour.imageUrl ?? undefined,
    touristType: tour.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'ZAR',
      price: Number(tour.priceFrom),
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'TravelAgency',
      name: 'Capiverse',
      url: baseUrl,
    },
  };
}

export function attractionSchema(attraction: {
  name: string;
  slug: string;
  shortDescription: string;
  latitude?: number | null;
  longitude?: number | null;
  imageUrl?: string | null;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://capeverse.vercel.app';
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: attraction.name,
    description: attraction.shortDescription,
    url: `${baseUrl}/attractions/${attraction.slug}`,
    image: attraction.imageUrl ?? undefined,
    geo: attraction.latitude && attraction.longitude
      ? {
          '@type': 'GeoCoordinates',
          latitude: attraction.latitude,
          longitude: attraction.longitude,
        }
      : undefined,
  };
}

export function organizationSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://capeverse.vercel.app';
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: 'Capiverse',
    url: baseUrl,
    description: 'AI-powered private tour platform for Cape Town — personalised itineraries, curated experiences.',
    areaServed: 'Cape Town, South Africa',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'German', 'French', 'Dutch'],
    },
  };
}
