/**
 * Pure scoring functions extracted from the AI recommendation engine.
 * These have no side effects and no external dependencies — fully unit-testable.
 */

export type AttractionStub = {
  id: string;
  name: string;
  slug: string;
  region: string;
  tags: string[];
};

export type PlannerInput = {
  days: number;
  groupType: string;
  budget: string;
  pace: string;
  interests: string[];
  mustSee?: string[];
};

export const TAG_WEIGHTS: Record<string, string[]> = {
  scenic: ['scenic', 'iconic', 'nature', 'photography'],
  wine: ['wine', 'food', 'luxury', 'romantic'],
  city: ['city', 'culture', 'history'],
  culture: ['culture', 'history', 'food', 'city'],
  family: ['family', 'wildlife', 'relaxed'],
  luxury: ['luxury', 'romantic', 'food', 'wine'],
  adventure: ['nature', 'scenic', 'iconic']
};

export function scoreAttraction(attraction: AttractionStub, input: PlannerInput): number {
  const tags = attraction.tags.map((t) => t.toLowerCase());
  let score = 0;

  for (const interest of input.interests) {
    const weighted = TAG_WEIGHTS[interest.toLowerCase()] || [interest.toLowerCase()];
    for (const tag of weighted) {
      if (tags.includes(tag)) score += 10;
    }
  }

  if (input.mustSee?.includes(attraction.slug)) score += 25;
  if (input.groupType.toLowerCase().includes('family') && tags.includes('family')) score += 8;
  if (input.budget.toLowerCase().includes('luxury') && tags.includes('luxury')) score += 8;
  if (input.pace.toLowerCase().includes('relaxed') && tags.includes('relaxed')) score += 5;

  return score;
}

export function rankAttractions(
  attractions: AttractionStub[],
  input: PlannerInput
): Array<{ attraction: AttractionStub; score: number }> {
  return attractions
    .map((attraction) => ({ attraction, score: scoreAttraction(attraction, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(3, input.days * 3));
}

export function buildDayGroups(
  scored: Array<{ attraction: AttractionStub; score: number }>,
  days: number
) {
  const groups = [];
  for (let day = 1; day <= days; day++) {
    const slice = scored.slice((day - 1) * 3, day * 3);
    if (!slice.length) continue;
    groups.push({
      day,
      title: slice.some((s) => s.attraction.region.includes('Winelands'))
        ? 'Winelands & relaxed tastings'
        : slice.some((s) => s.attraction.slug === 'cape-point' || s.attraction.slug === 'boulders-beach')
          ? 'Peninsula scenic highlights'
          : 'Cape Town city and signature experiences',
      items: slice
    });
  }
  return groups;
}
