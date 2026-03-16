import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ItineraryGenerateSchema } from '@/lib/schemas';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = ItineraryGenerateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid request' }, { status: 422 });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { attractionIds, days, budget, pace } = parsed;

  const attractions = await prisma.attraction.findMany({
    where: { id: { in: attractionIds } },
    orderBy: { createdAt: 'asc' }
  });

  const perDay = pace === 'Relaxed' ? 2 : pace === 'Packed' ? 4 : 3;
  const dayPlans = Array.from({ length: Math.max(days, 1) }).map((_, index) => {
    const slice = attractions.slice(index * perDay, (index + 1) * perDay);
    return {
      day: index + 1,
      title: slice.some((item) => item.region.includes('Winelands'))
        ? 'Wine, food, and scenic estates'
        : slice.some((item) => item.slug === 'cape-point' || item.slug === 'boulders-beach')
          ? 'Cape Peninsula highlights'
          : 'City and signature attractions',
      stops: slice.map((item) => ({ name: item.name, region: item.region }))
    };
  }).filter((day) => day.stops.length > 0);

  const estimatedPriceBand = budget === 'Luxury'
    ? 'Estimated from ZAR 4,000+ per day'
    : budget === 'Premium'
      ? 'Estimated from ZAR 3,000+ per day'
      : budget === 'Budget'
        ? 'Estimated from ZAR 1,500+ per day'
        : 'Estimated from ZAR 2,200+ per day';

  const recommendedTourType = attractions.length > 3 || days > 1 ? 'Private full-day custom planning' : 'Half-day custom experience';

  return NextResponse.json({
    summary:
      attractions.length > perDay * days
        ? 'Your selection is ambitious. We recommend splitting these attractions across multiple days for a better pace.'
        : 'This selection fits into a practical custom route and can be used as the basis for a client-ready itinerary.',
    recommendedTourType,
    estimatedPriceBand,
    days: dayPlans
  });
}
