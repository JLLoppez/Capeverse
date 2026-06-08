import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { rankAttractions, buildDayGroups, checkFeasibility, type PlannerInput } from '@/lib/scoring';

export type { PlannerInput };

export async function generateRecommendation(input: PlannerInput) {
  const attractions = await prisma.attraction.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, region: true, tags: true, estimatedVisitMinutes: true },
  });

  const attractionStubs = attractions.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    region: a.region,
    tags: Array.isArray(a.tags) ? (a.tags as string[]) : [],
    estimatedVisitMinutes: a.estimatedVisitMinutes ?? 60,
  }));

  // FIX: interests are now passed correctly from the caller
  const scored = rankAttractions(attractionStubs, input);
  const grouped = buildDayGroups(scored, input.days, input.pace);
  const feasibility = checkFeasibility(scored, input.days, input.pace);

  const topNames = grouped.flatMap((g) => g.items.slice(0, 2).map((i) => i.attraction.name));

  const fallbackText = `Based on your ${input.days}-day trip, ${input.groupType} travel style, and interests in ${input.interests.join(', ')}, I'd recommend focusing on ${topNames.slice(0, 3).join(', ')}. This gives you a balanced Cape Town experience without overloading the day.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: fallbackText,
      warnings: feasibility.warnings,
      days: grouped.map((group) => ({
        day: group.day,
        title: group.title,
        stops: group.items.map((item) => ({
          name: item.attraction.name,
          reason: `Matches your interests and fits a practical Cape Town route.`,
          region: item.attraction.region,
        })),
      })),
    };
  }

  const client = new OpenAI({ apiKey });
  const prompt = `You are a premium Cape Town travel planner. Create a concise personalised recommendation.
Input: ${JSON.stringify(input)}
Candidate attractions (geographically clustered, time-budgeted): ${JSON.stringify(grouped.map((g) => ({ day: g.day, title: g.title, stops: g.items.map((i) => ({ name: i.attraction.name, region: i.attraction.region, tags: i.attraction.tags })) })))}
${feasibility.warnings.length > 0 ? `Warnings: ${feasibility.warnings.join(' | ')}` : ''}
Return JSON only (no markdown) with keys: summary, days [{day, title, stops:[{name, reason, region}]}]. Be specific to this traveller's interests and group type.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    });
    const text = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text);
    return { ...parsed, warnings: feasibility.warnings };
  } catch {
    return {
      summary: fallbackText,
      warnings: feasibility.warnings,
      days: grouped.map((group) => ({
        day: group.day,
        title: group.title,
        stops: group.items.map((item) => ({
          name: item.attraction.name,
          reason: `Matches your interests and fits a practical Cape Town route.`,
          region: item.attraction.region,
        })),
      })),
    };
  }
}
