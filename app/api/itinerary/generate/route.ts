/**
 * Fix: removed top-level `import OpenAI`.
 * OpenAI is now dynamically imported only when the API key is present.
 * Also: stubs now include latitude/longitude for geographic clustering.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ItineraryGenerateSchema } from '@/lib/schemas';
import { rankAttractions, buildDayGroups } from '@/lib/scoring';
import { rateLimitResponse } from '@/lib/rateLimit';
import { ZodError } from 'zod';

const PRICE_BANDS: Record<string, string> = {
  Luxury:      'Estimated from ZAR 4,000+ per day (private guide, premium transport)',
  Premium:     'Estimated from ZAR 3,000+ per day (semi-private, quality dining)',
  'Mid-range': 'Estimated from ZAR 2,200+ per day (shared transfers, mid-range dining)',
  Budget:      'Estimated from ZAR 1,500+ per day (self-drive, casual dining)',
};

function fallbackSummary(count: number, days: number, pace: string): string {
  if (count > 3 || days > 1)
    return `Your selection covers ${count} highlights across ${days} day(s) at a ${pace.toLowerCase()} pace. We recommend splitting these into a practical custom route — a consultant can finalise timing and logistics.`;
  return `This selection fits into a practical custom route and can be used as the basis for a client-ready itinerary. A consultant can refine timing and add private transport options.`;
}

export async function POST(request: Request) {
  const limited = rateLimitResponse(request, 'itinerary');
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  let parsed: ReturnType<typeof ItineraryGenerateSchema.parse>;
  try {
    parsed = ItineraryGenerateSchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid request' }, { status: 422 });
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { attractionIds, days, budget, pace, groupType } = parsed;

  const dbAttractions = await prisma.attraction.findMany({
    where: { id: { in: attractionIds }, isActive: true },
  });

  const stubs = dbAttractions.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    region: a.region,
    tags: a.tags as string[],
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
  }));

  const mustSee = attractionIds.map(
    (id) => dbAttractions.find((a) => a.id === id)?.slug ?? ''
  ).filter(Boolean);

  const ranked   = rankAttractions(stubs, { days, groupType, budget, pace, interests: [], mustSee });
  const dayGroups = buildDayGroups(ranked, days);

  const estimatedPriceBand  = PRICE_BANDS[budget] ?? PRICE_BANDS['Mid-range'];
  const recommendedTourType = dbAttractions.length > 3 || days > 1
    ? 'Private full-day custom planning'
    : 'Half-day custom experience';

  const shapedDays = dayGroups.map((g) => ({
    day: g.day,
    title: g.title,
    stops: g.items.map((i) => ({ name: i.attraction.name, region: i.attraction.region })),
  }));

  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const attractionList = dayGroups
        .map((g) => `Day ${g.day} (${g.title}): ${g.items.map((i) => i.attraction.name).join(', ')}`)
        .join('\n');

      const prompt =
        `You are a Cape Town luxury travel consultant writing a personalised trip summary.\n\n` +
        `Trip details:\n` +
        `- Duration: ${days} day(s)\n- Group: ${groupType}\n- Budget: ${budget}\n- Pace: ${pace}\n` +
        `- Itinerary:\n${attractionList}\n\n` +
        `Write a warm, specific 3-sentence trip summary that:\n` +
        `1. Opens with what makes this particular combination of stops special\n` +
        `2. Mentions the pace and what the traveller will feel (not just see)\n` +
        `3. Closes with a natural call to enquire with a consultant\n\n` +
        `Do not use generic phrases like "unforgettable journey". Be specific to these exact attractions.`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      });

      const aiSummary = response.choices[0]?.message?.content?.trim();

      return NextResponse.json({
        summary: aiSummary ?? fallbackSummary(dbAttractions.length, days, pace),
        recommendedTourType,
        estimatedPriceBand,
        days: shapedDays,
        aiEnriched: true,
      });
    } catch {
      // Fall through to rule-based response
    }
  }

  return NextResponse.json({
    summary: fallbackSummary(dbAttractions.length, days, pace),
    recommendedTourType,
    estimatedPriceBand,
    days: shapedDays,
    aiEnriched: false,
  });
}
