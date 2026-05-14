import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { ItineraryGenerateSchema } from '@/lib/schemas';
import { rankAttractions, buildDayGroups } from '@/lib/scoring';
import { rateLimitResponse } from '@/lib/rateLimit';
import { ZodError } from 'zod';

const PRICE_BANDS: Record<string, string> = {
  Luxury:    'Estimated from ZAR 4,000+ per day (private guide, premium transport)',
  Premium:   'Estimated from ZAR 3,000+ per day (semi-private, quality dining)',
  'Mid-range': 'Estimated from ZAR 2,200+ per day (shared transfers, mid-range dining)',
  Budget:    'Estimated from ZAR 1,500+ per day (self-drive, casual dining)',
};

export async function POST(request: Request) {
  // Rate limit: 15 itinerary generations per minute per IP
  const limited = rateLimitResponse(request, 'itinerary');
  if (limited) return limited;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

  let parsed: ReturnType<typeof ItineraryGenerateSchema.parse>;
  try { parsed = ItineraryGenerateSchema.parse(body); }
  catch (err) {
    if (err instanceof ZodError)
      return NextResponse.json({ error: err.issues[0]?.message ?? 'Invalid request' }, { status: 422 });
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { attractionIds, days, budget, pace, groupType } = parsed;

  const dbAttractions = await prisma.attraction.findMany({
    where: { id: { in: attractionIds }, isActive: true },
  });

  // Use the scoring engine to rank and organise attractions
  const stubs = dbAttractions.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    region: a.region,
    tags: a.tags as string[],
  }));

  const ranked = rankAttractions(stubs, { days, groupType, budget, pace, interests: [], mustSee: attractionIds.map(id => dbAttractions.find(a => a.id === id)?.slug ?? '') });
  const dayGroups = buildDayGroups(ranked, days);

  const estimatedPriceBand = PRICE_BANDS[budget] ?? PRICE_BANDS['Mid-range'];
  const recommendedTourType = dbAttractions.length > 3 || days > 1
    ? 'Private full-day custom planning'
    : 'Half-day custom experience';

  // --- GPT narrative enrichment ---
  if (process.env.OPENAI_API_KEY) {
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const attractionList = dayGroups
        .map(g => `Day ${g.day} (${g.title}): ${g.items.map(i => i.attraction.name).join(', ')}`)
        .join('\n');

      const prompt = `You are a Cape Town luxury travel consultant writing a personalised trip summary.

Trip details:
- Duration: ${days} day(s)
- Group: ${groupType}
- Budget: ${budget}
- Pace: ${pace}
- Itinerary:
${attractionList}

Write a warm, specific 3-sentence trip summary that:
1. Opens with what makes this particular combination of stops special
2. Mentions the pace and what the traveller will feel (not just see)
3. Closes with a natural call to enquire with a consultant

Do not use generic phrases like "unforgettable journey". Be specific to these exact attractions.`;

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
        days: dayGroups.map(g => ({
          day: g.day,
          title: g.title,
          stops: g.items.map(i => ({ name: i.attraction.name, region: i.attraction.region })),
        })),
        aiEnriched: true,
      });
    } catch {
      // Fall through to rule-based response
    }
  }

  // Rule-based fallback (no API key or GPT error)
  return NextResponse.json({
    summary: fallbackSummary(dbAttractions.length, days, pace),
    recommendedTourType,
    estimatedPriceBand,
    days: dayGroups.map(g => ({
      day: g.day,
      title: g.title,
      stops: g.items.map(i => ({ name: i.attraction.name, region: i.attraction.region })),
    })),
    aiEnriched: false,
  });
}

function fallbackSummary(count: number, days: number, pace: string): string {
  if (count > 3 || days > 1)
    return `Your selection covers ${count} highlights across ${days} day(s) at a ${pace.toLowerCase()} pace. We recommend splitting these into a practical custom route — a consultant can finalise timing and logistics.`;
  return `This selection fits into a practical custom route and can be used as the basis for a client-ready itinerary. A consultant can refine timing and add private transport options.`;
}
