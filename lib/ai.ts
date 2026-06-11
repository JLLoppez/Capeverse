import { prisma }                                                        from '@/lib/prisma';
import { rankAttractions, buildDayGroups, checkFeasibility }            from '@/lib/scoring';
import { generateJSON, isGeminiConfigured }                             from '@/lib/gemini';
import type { PlannerInput }                                            from '@/lib/scoring';

export type { PlannerInput };

export async function generateRecommendation(input: PlannerInput) {
  const attractions = await prisma.attraction.findMany({
    where:  { isActive: true },
    select: { id: true, name: true, slug: true, region: true, tags: true, estimatedVisitMinutes: true },
  });

  const stubs = attractions.map((a) => ({
    id:                    a.id,
    name:                  a.name,
    slug:                  a.slug,
    region:                a.region,
    tags:                  Array.isArray(a.tags) ? (a.tags as string[]) : [],
    estimatedVisitMinutes: a.estimatedVisitMinutes ?? 60,
  }));

  const scored      = rankAttractions(stubs, input);
  const grouped     = buildDayGroups(scored, input.days, input.pace);
  const feasibility = checkFeasibility(scored, input.days, input.pace);

  const topNames = grouped
    .flatMap((g) => g.items.slice(0, 2).map((i) => i.attraction.name))
    .slice(0, 3)
    .join(', ');

  const fallbackDays = grouped.map((group) => ({
    day:   group.day,
    title: group.title,
    stops: group.items.map((item) => ({
      name:   item.attraction.name,
      reason: 'Matches your interests and fits a practical Cape Town route.',
      region: item.attraction.region,
    })),
  }));

  const fallback = {
    summary:  `Based on your ${input.days}-day trip, ${input.groupType} travel style, and interests in ${input.interests.join(', ')}, I'd recommend focusing on ${topNames}. This gives you a balanced Cape Town experience without overloading the day.`,
    warnings: feasibility.warnings,
    days:     fallbackDays,
  };

  if (!isGeminiConfigured()) return fallback;

  const prompt = `You are a premium Cape Town travel planner. Create a concise personalised recommendation.
Input: ${JSON.stringify(input)}
Candidate attractions (geographically clustered, time-budgeted): ${JSON.stringify(
    grouped.map((g) => ({
      day:   g.day,
      title: g.title,
      stops: g.items.map((i) => ({ name: i.attraction.name, region: i.attraction.region, tags: i.attraction.tags })),
    }))
  )}
${feasibility.warnings.length > 0 ? `Warnings: ${feasibility.warnings.join(' | ')}` : ''}
Return JSON only (no markdown) with keys: summary (string), days (array of {day, title, stops:[{name, reason, region}]}).
Be specific to this traveller's interests and group type.`;

  try {
    const parsed = await generateJSON<{ summary: string; days: typeof fallbackDays }>(prompt);
    return { summary: parsed.summary, days: parsed.days, warnings: feasibility.warnings };
  } catch {
    return fallback;
  }
}
