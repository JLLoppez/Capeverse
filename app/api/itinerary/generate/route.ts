import { NextResponse }                                    from 'next/server';
import { ZodError }                                        from 'zod';
import { prisma }                                          from '@/lib/prisma';
import { ItineraryGenerateSchema }                         from '@/lib/schemas';
import { rankAttractions, buildDayGroups, checkFeasibility } from '@/lib/scoring';
import { generateJSON, isGeminiConfigured }                from '@/lib/gemini';
import { rateLimitResponse }                               from '@/lib/rateLimit';
import { getCTWeather }                                    from '@/lib/weather';

const PRICE_BANDS: Record<string, string> = {
  Luxury:      'Estimated from ZAR 4,000+ per day (private guide, premium transport)',
  Premium:     'Estimated from ZAR 3,000+ per day (semi-private, quality dining)',
  'Mid-range': 'Estimated from ZAR 2,200+ per day (shared transfers, mid-range dining)',
  Budget:      'Estimated from ZAR 1,500+ per day (self-drive, casual dining)',
};

export async function POST(request: Request) {
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

  const { attractionIds, days, budget, pace, groupType, interests } = parsed;

  const dbAttractions = await prisma.attraction.findMany({
    where:  { id: { in: attractionIds }, isActive: true },
    select: { id: true, name: true, slug: true, region: true, tags: true, estimatedVisitMinutes: true },
  });

  const stubs = dbAttractions.map((a) => ({
    id:                    a.id,
    name:                  a.name,
    slug:                  a.slug,
    region:                a.region,
    tags:                  a.tags as string[],
    estimatedVisitMinutes: a.estimatedVisitMinutes ?? 60,
  }));

  const mustSee    = stubs.map((s) => s.slug);
  const ranked     = rankAttractions(stubs, { days, groupType, budget, pace, interests, mustSee });
  const dayGroups  = buildDayGroups(ranked, days, pace);
  const feasibility = checkFeasibility(ranked, days, pace);

  const estimatedPriceBand  = PRICE_BANDS[budget] ?? PRICE_BANDS['Mid-range'];
  const recommendedTourType = dbAttractions.length > 3 || days > 1
    ? 'Private full-day custom planning'
    : 'Half-day custom experience';

  // ── Live weather context (non-blocking) ───────────────────────────────────
  let weatherContext = '';
  try {
    const weather = await getCTWeather();
    weatherContext = weather.microclimate.promptContext;
  } catch {
    // Weather unavailable — itinerary generates without it
  }

  // ── Gemini enrichment ─────────────────────────────────────────────────────
  if (isGeminiConfigured()) {
    try {
      const groupedForAI = dayGroups.map((g) => ({
        day:           g.day,
        cluster:       g.cluster,
        suggestedTitle:g.title,
        totalMinutes:  g.totalMinutes,
        stops: g.items.map((i) => ({
          name:                  i.attraction.name,
          region:                i.attraction.region,
          tags:                  i.attraction.tags,
          estimatedVisitMinutes: i.attraction.estimatedVisitMinutes ?? 60,
        })),
      }));

      const prompt = `You are a Cape Town luxury travel consultant building a final client itinerary.

Trip details:
- Duration: ${days} day(s)
- Group: ${groupType}
- Budget: ${budget}
- Pace: ${pace}
- Interests: ${interests.join(', ')}
${feasibility.warnings.length > 0 ? `- Notes: ${feasibility.warnings.join(' | ')}` : ''}
${weatherContext ? `\nLive Cape Town conditions for Day 1:\n${weatherContext}\nUse these to sequence stops wisely. If conditions affect a specific stop (e.g. Table Mountain cable car likely closed, Atlantic Seaboard windy), note this naturally in that stop's reason or the summary.\n` : ''}
Proposed day structure (geographically clustered, time-budgeted):
${JSON.stringify(groupedForAI, null, 2)}

Your tasks:
1. Confirm or improve each day title — make it specific and evocative, not generic.
2. For each stop, write a 1-sentence reason tailored to this traveller's interests and group type.
3. If any day is geographically illogical or time-impossible, flag it in the summary.
4. Write a warm 3-sentence trip summary: open with what makes this combination special, describe what the traveller will feel (not just see), close with a natural call to speak to a consultant.
5. Do NOT use "unforgettable journey" or "once-in-a-lifetime".

Return JSON only with this exact shape:
{"summary":"string","days":[{"day":1,"title":"string","stops":[{"name":"string","reason":"string","region":"string"}]}]}`;

      const result = await generateJSON<{
        summary: string;
        days: Array<{ day: number; title: string; stops: Array<{ name: string; reason: string; region: string }> }>;
      }>(prompt);

      return NextResponse.json({
        summary:             result.summary ?? fallbackSummary(dbAttractions.length, days, pace),
        recommendedTourType,
        estimatedPriceBand,
        days:                result.days ?? dayGroups.map(serializeGroup),
        warnings:            feasibility.warnings,
        droppedAttractions:  feasibility.droppedAttractions.map((a) => a.name),
        aiEnriched:          true,
        weatherEnriched:     !!weatherContext,
      });
    } catch {
      // Fall through to rule-based response
    }
  }

  return NextResponse.json({
    summary:            fallbackSummary(dbAttractions.length, days, pace),
    recommendedTourType,
    estimatedPriceBand,
    days:               dayGroups.map(serializeGroup),
    warnings:           feasibility.warnings,
    droppedAttractions: feasibility.droppedAttractions.map((a) => a.name),
    aiEnriched:         false,
    weatherEnriched:    false,
  });
}

function serializeGroup(g: ReturnType<typeof buildDayGroups>[number]) {
  return {
    day:   g.day,
    title: g.title,
    stops: g.items.map((i) => ({
      name:   i.attraction.name,
      region: i.attraction.region,
      reason: 'Matches your interests and fits a practical Cape Town route.',
    })),
  };
}

function fallbackSummary(count: number, days: number, pace: string): string {
  if (count > 3 || days > 1)
    return `Your selection covers ${count} highlights across ${days} day${days > 1 ? 's' : ''} at a ${pace.toLowerCase()} pace. We recommend splitting these into a practical custom route — a consultant can finalise timing and logistics.`;
  return `This selection fits into a practical custom route and can be used as the basis for a client-ready itinerary. A consultant can refine timing and add private transport options.`;
}
