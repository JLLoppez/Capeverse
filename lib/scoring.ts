/**
 * Pure scoring, clustering, and validation functions for the itinerary engine.
 * No side effects, no external dependencies — fully unit-testable.
 */

export type AttractionStub = {
  id: string;
  name: string;
  slug: string;
  region: string;
  tags: string[];
  estimatedVisitMinutes?: number;
};

export type PlannerInput = {
  days: number;
  groupType: string;
  budget: string;
  pace: string;
  interests: string[];
  mustSee?: string[];
};

// ─── Pace → daily time budget (minutes) ─────────────────────────────────────

export const PACE_BUDGET_MINUTES: Record<string, number> = {
  Relaxed: 360,   // 6 hours
  Balanced: 480,  // 8 hours
  Packed: 600,    // 10 hours
};

// ─── Geographic clusters: regions that should share a day ────────────────────

export const REGION_CLUSTERS: Record<string, string> = {
  // Cape Peninsula group
  'Cape Peninsula': 'peninsula',
  'Simons Town':    'peninsula',
  'Atlantic Seaboard': 'peninsula',
  // Winelands group
  'Cape Winelands': 'winelands',
  'Winelands':      'winelands',
  // City group
  'City Bowl':      'city',
  'Cape Town CBD':  'city',
  'Newlands':       'city',
  'Gardens':        'city',
  // Default: own cluster
};

export function getCluster(region: string): string {
  return REGION_CLUSTERS[region] ?? region.toLowerCase().replace(/\s+/g, '-');
}

// ─── Interest → tag weight expansion ────────────────────────────────────────

export const TAG_WEIGHTS: Record<string, string[]> = {
  scenic:    ['scenic', 'iconic', 'nature', 'photography', 'road-trip'],
  wine:      ['wine', 'food', 'luxury', 'romantic'],
  city:      ['city', 'culture', 'history', 'food'],
  culture:   ['culture', 'history', 'food', 'city', 'photography'],
  family:    ['family', 'wildlife', 'relaxed', 'beach'],
  luxury:    ['luxury', 'romantic', 'food', 'wine', 'scenic'],
  adventure: ['nature', 'scenic', 'iconic', 'road-trip'],
  food:      ['food', 'wine', 'culture', 'luxury'],
  beach:     ['beach', 'scenic', 'relaxed', 'family'],
  wildlife:  ['wildlife', 'nature', 'family', 'photography'],
};

// ─── Score a single attraction against planner input ────────────────────────

export function scoreAttraction(attraction: AttractionStub, input: PlannerInput): number {
  const tags = attraction.tags.map((t) => t.toLowerCase());
  let score = 0;

  for (const interest of input.interests) {
    const weighted = TAG_WEIGHTS[interest.toLowerCase()] ?? [interest.toLowerCase()];
    for (const tag of weighted) {
      if (tags.includes(tag)) score += 10;
    }
  }

  if (input.mustSee?.includes(attraction.slug)) score += 25;
  if (input.groupType.toLowerCase().includes('family') && tags.includes('family')) score += 8;
  if (input.budget.toLowerCase().includes('luxury') && tags.includes('luxury')) score += 8;
  if (input.pace.toLowerCase() === 'relaxed' && tags.includes('relaxed')) score += 5;
  if (input.pace.toLowerCase() === 'packed' && tags.includes('iconic')) score += 3;

  return score;
}

// ─── Rank all attractions, no hard cap (caller decides how many to use) ──────

export function rankAttractions(
  attractions: AttractionStub[],
  input: PlannerInput
): Array<{ attraction: AttractionStub; score: number }> {
  return attractions
    .map((attraction) => ({ attraction, score: scoreAttraction(attraction, input) }))
    .sort((a, b) =>
      b.score !== a.score
        ? b.score - a.score
        : a.attraction.name.localeCompare(b.attraction.name)  // stable tie-break
    );
}

// ─── Day title from cluster name ─────────────────────────────────────────────

export function clusterTitle(cluster: string): string {
  const titles: Record<string, string> = {
    peninsula: 'Cape Peninsula scenic highlights',
    winelands: 'Winelands & relaxed tastings',
    city:      'Cape Town city & culture',
  };
  return titles[cluster] ?? `${cluster.replace(/-/g, ' ')} highlights`;
}

// ─── Build day groups with geographic clustering + time-budget enforcement ───

export type DayGroup = {
  day: number;
  title: string;
  cluster: string;
  items: Array<{ attraction: AttractionStub; score: number }>;
  totalMinutes: number;
  overCapacity: boolean;
};

export function buildDayGroups(
  scored: Array<{ attraction: AttractionStub; score: number }>,
  days: number,
  pace: string = 'Balanced'
): DayGroup[] {
  const budgetMinutes = PACE_BUDGET_MINUTES[pace] ?? PACE_BUDGET_MINUTES['Balanced'];

  // Step 1: group by geographic cluster, preserving score order within each cluster
  const clusterMap = new Map<string, Array<{ attraction: AttractionStub; score: number }>>();
  for (const item of scored) {
    const cluster = getCluster(item.attraction.region);
    if (!clusterMap.has(cluster)) clusterMap.set(cluster, []);
    clusterMap.get(cluster)!.push(item);
  }

  // Step 2: sort clusters by highest score of their best member (most relevant cluster first)
  const sortedClusters = Array.from(clusterMap.entries()).sort(
    (a, b) => (b[1][0]?.score ?? 0) - (a[1][0]?.score ?? 0)
  );

  // Step 3: assign clusters to days (one cluster per day where possible; split large clusters)
  const groups: DayGroup[] = [];
  let dayNum = 1;

  for (const [cluster, items] of sortedClusters) {
    if (dayNum > days) break;

    // Split cluster across days if it exceeds the time budget
    let chunk: typeof items = [];
    let chunkMinutes = 0;

    for (const item of items) {
      const mins = item.attraction.estimatedVisitMinutes ?? 60;
      if (chunk.length > 0 && chunkMinutes + mins > budgetMinutes) {
        // Flush current chunk as a day
        groups.push({
          day: dayNum,
          title: clusterTitle(cluster),
          cluster,
          items: chunk,
          totalMinutes: chunkMinutes,
          overCapacity: false,
        });
        dayNum++;
        chunk = [];
        chunkMinutes = 0;
        if (dayNum > days) break;
      }
      chunk.push(item);
      chunkMinutes += mins;
    }

    if (chunk.length > 0 && dayNum <= days) {
      groups.push({
        day: dayNum,
        title: clusterTitle(cluster),
        cluster,
        items: chunk,
        totalMinutes: chunkMinutes,
        overCapacity: chunkMinutes > budgetMinutes,
      });
      dayNum++;
    }
  }

  return groups;
}

// ─── Validate that a set of attractions is feasible for the requested days ───

export type FeasibilityResult = {
  feasible: boolean;
  warnings: string[];
  droppedAttractions: AttractionStub[];
  usedAttractions: AttractionStub[];
};

export function checkFeasibility(
  scored: Array<{ attraction: AttractionStub; score: number }>,
  days: number,
  pace: string
): FeasibilityResult {
  const groups = buildDayGroups(scored, days, pace);
  const usedSlugs = new Set(groups.flatMap((g) => g.items.map((i) => i.attraction.slug)));
  const allSlugs = new Set(scored.map((s) => s.attraction.slug));

  const dropped = scored
    .filter((s) => !usedSlugs.has(s.attraction.slug))
    .map((s) => s.attraction);

  const warnings: string[] = [];

  if (dropped.length > 0) {
    warnings.push(
      `${dropped.length} attraction${dropped.length > 1 ? 's' : ''} couldn't fit into ${days} day${days > 1 ? 's' : ''} at your chosen pace: ${dropped.map((a) => a.name).join(', ')}. Consider adding a day or switching to a Packed pace.`
    );
  }

  const overCapacityDays = groups.filter((g) => g.overCapacity);
  for (const day of overCapacityDays) {
    warnings.push(
      `Day ${day.day} (${day.title}) is at ${Math.round(day.totalMinutes / 60 * 10) / 10} hours — slightly over the ${pace} pace budget. A consultant can adjust timing.`
    );
  }

  return {
    feasible: dropped.length === 0,
    warnings,
    droppedAttractions: dropped,
    usedAttractions: scored
      .filter((s) => usedSlugs.has(s.attraction.slug))
      .map((s) => s.attraction),
  };
}


// ── Destination-aware cluster lookup (replaces hardcoded REGION_CLUSTERS) ────

/**
 * Returns the cluster key for a region, using the active destination's cluster map
 * if available, otherwise falling back to the static REGION_CLUSTERS table above.
 * Import and pass `destinationClusters` from `getActiveDestination().regionClusters`
 * in server contexts where you have access to the destination registry.
 */
export function getClusterForDestination(
  region: string,
  destinationClusters?: Record<string, string>
): string {
  if (destinationClusters && destinationClusters[region]) {
    return destinationClusters[region];
  }
  return getCluster(region); // fall back to static map
}
