import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { rankAttractions, buildDayGroups, type PlannerInput } from '@/lib/scoring';

export type { PlannerInput };

export async function generateRecommendation(input: PlannerInput) {
  const attractions = await prisma.attraction.findMany({ where: { isActive: true } });

  const attractionStubs = attractions.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    region: a.region,
    tags: Array.isArray(a.tags) ? (a.tags as string[]) : []
  }));

  const scored = rankAttractions(attractionStubs, input);
  const grouped = buildDayGroups(scored, input.days);

  const fallbackText = `Based on your ${input.days}-day trip, ${input.groupType} travel style, and interests in ${input.interests.join(', ')}, I’d recommend focusing on ${scored
    .slice(0, 3)
    .map((s) => s.attraction.name)
    .join(', ')}. This gives you a balanced Cape Town experience without overloading the day.`;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      summary: fallbackText,
      days: grouped.map((group) => ({
        day: group.day,
        title: group.title,
        stops: group.items.map((item) => ({
          name: item.attraction.name,
          reason: `Matches your interests and fits a practical Cape Town route.`,
          region: item.attraction.region
        }))
      }))
    };
  }

  const client = new OpenAI({ apiKey });
  const prompt = `You are a premium Cape Town travel planner. Create a concise personalized recommendation.
Input: ${JSON.stringify(input)}
Candidate attractions: ${JSON.stringify(scored.map((s) => ({ name: s.attraction.name, region: s.attraction.region, tags: s.attraction.tags })))}
Return JSON only (no markdown) with keys: summary, days [{day,title,stops:[{name,reason,region}]}]. Keep it practical and realistic.`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    });
    const text = response.choices[0]?.message?.content ?? '';
    const parsed = JSON.parse(text);
    return parsed;
  } catch {
    return {
      summary: fallbackText,
      days: grouped.map((group) => ({
        day: group.day,
        title: group.title,
        stops: group.items.map((item) => ({
          name: item.attraction.name,
          reason: `Matches your interests and fits a practical Cape Town route.`,
          region: item.attraction.region
        }))
      }))
    };
  }
}
