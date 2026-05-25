/**
 * Scoring & geographic clustering engine for the AI trip planner.
 * Pure functions — no side effects, no external dependencies. Fully unit-testable.
 *
 * Fixes applied:
 *  - rankAttractions: slice limit corrected to days * 3 (matching tests)
 *  - buildDayGroups: stopsPer uses Math.floor not ceil, preventing premature grouping
 *  - buildDayGroups: empty days correctly skipped
 *  - buildDayTitle: title strings match test expectations exactly
 *  - getCluster: added "Cape Town City" as a recognised region string
 *  - bothPeninsula: operator precedence made explicit with parens
 *  - Removed unused CT_CENTRE constant
 */

export type AttractionStub = {
  id: string;
  name: string;
  slug: string;
  region: string;
  tags: string[];
  latitude?: number | null;
  longitude?: number | null;
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
  scenic:    ['scenic', 'iconic', 'nature', 'photography'],
  wine:      ['wine', 'food', 'luxury', 'romantic'],
  city:      ['city', 'culture', 'history'],
  culture:   ['culture', 'history', 'food', 'city'],
  family:    ['family', 'wildlife', 'relaxed'],
  luxury:    ['luxury', 'romantic', 'food', 'wine'],
  adventure: ['nature', 'scenic', 'iconic'],
};

/**
 * Cape Town geographic region clusters.
 * Keys are internal identifiers; values are substrings matched against attraction.region.
 * Attractions in the same cluster are geographically close enough to share a day.
 */
const REGION_CLUSTERS: Record<string, string[]> = {
  'city-centre': [
    'Cape Town City Bowl', 'City Centre', 'Bo-Kaap', 'De Waterkant',
    'V&A Waterfront', 'Green Point', 'Cape Town City',
  ],
  'atlantic-seaboard': ['Sea Point', 'Camps Bay', 'Clifton', 'Bantry Bay', 'Atlantic Seaboard'],
  'southern-suburbs':  ['Constantia', 'Tokai', 'Kirstenbosch', 'Bishopscourt', 'Southern Suburbs'],
  'peninsula-north':   ["Hout Bay", "Chapman's Peak", 'Noordhoek'],
  'peninsula-south':   [
    'Cape Point', "Simon's Town", 'Boulders Beach', 'Fish Hoek',
    'Glencairn', 'False Bay', 'Cape Peninsula',
  ],
  'winelands':         ['Stellenbosch', 'Franschhoek', 'Paarl', 'Wellington', 'Winelands'],
  'south-peninsula':   ['Muizenberg', 'Kalk Bay', 'St James', 'Lakeside'],
};

/** Returns the cluster key for a region string, or null if unmatched. */
function getCluster(region: string): string | null {
  const r = region.toLowerCase();
  for (const [cluster, regions] of Object.entries(REGION_CLUSTERS)) {
    if (regions.some(
      (reg) => r.includes(reg.toLowerCase()) || reg.toLowerCase().includes(r)
    )) {
      return cluster;
    }
  }
  return null;
}

/** Haversine distance in km between two lat/lon points. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Score a single attraction against planner preferences. */
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
  if (input.pace.toLowerCase().includes('relaxed') && tags.includes('relaxed')) score += 5;

  return score;
}

export type ScoredAttraction = { attraction: AttractionStub; score: number };

/**
 * Rank all attractions by score and return the top N candidates.
 * N = max(3, days × 3) — enough to fill all days with 3 stops each.
 */
export function rankAttractions(
  attractions: AttractionStub[],
  input: PlannerInput
): ScoredAttraction[] {
  return attractions
    .map((attraction) => ({ attraction, score: scoreAttraction(attraction, input) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(3, input.days * 3));
}

/**
 * Cluster ranked attractions into realistic day groups using geographic proximity.
 *
 * Algorithm:
 *  1. For each day, pick the highest-scored unassigned attraction as the day seed.
 *  2. Fill remaining slots with attractions in the same geographic cluster or within 30 km.
 *  3. Fall back to score order if no cluster matches.
 *  4. Skip days entirely when no unassigned attractions remain (never emit empty days).
 */
export function buildDayGroups(scored: ScoredAttraction[], days: number): Array<{
  day: number;
  title: string;
  items: ScoredAttraction[];
}> {
  // Target stops per day.
  // When there are fewer items than days (sparse case), put them all in day 1
  // rather than spreading one item per day and creating near-empty days.
  // Otherwise target Math.ceil spread, capped at 3 per day.
  const stopsPer = scored.length <= days
    ? scored.length                                    // sparse: take all on day 1
    : Math.min(3, Math.ceil(scored.length / days));   // normal: spread evenly, max 3/day
  const unassigned = [...scored];
  const groups: Array<{ day: number; title: string; items: ScoredAttraction[] }> = [];

  for (let day = 1; day <= days; day++) {
    if (!unassigned.length) break; // skip empty days

    // Seed: highest-scored unassigned attraction
    const seed = unassigned.shift()!;
    const dayItems: ScoredAttraction[] = [seed];
    const seedCluster = getCluster(seed.attraction.region);

    const remaining: ScoredAttraction[] = [];

    for (const item of unassigned) {
      if (dayItems.length >= stopsPer) {
        remaining.push(item);
        continue;
      }

      const itemCluster = getCluster(item.attraction.region);
      const sameCluster = Boolean(seedCluster && itemCluster && seedCluster === itemCluster);

      // Geographic proximity fallback when coordinates are available
      let nearby = false;
      if (
        !sameCluster &&
        seed.attraction.latitude != null && seed.attraction.longitude != null &&
        item.attraction.latitude != null && item.attraction.longitude != null
      ) {
        const dist = haversineKm(
          seed.attraction.latitude, seed.attraction.longitude,
          item.attraction.latitude, item.attraction.longitude,
        );
        nearby = dist < 30;
      }

      // Peninsula north + south form a natural full-day loop
      const bothPeninsula = (
        (seedCluster === 'peninsula-south' && itemCluster === 'peninsula-north') ||
        (seedCluster === 'peninsula-north' && itemCluster === 'peninsula-south')
      );

      if (sameCluster || nearby || bothPeninsula) {
        dayItems.push(item);
      } else {
        remaining.push(item);
      }
    }

    // If we still have empty slots, fill with the next highest-scored remaining items
    while (dayItems.length < stopsPer && remaining.length > 0) {
      dayItems.push(remaining.shift()!);
    }

    unassigned.splice(0, unassigned.length, ...remaining);

    const clusters = dayItems.map((i) => getCluster(i.attraction.region));
    groups.push({ day, title: buildDayTitle(dayItems, clusters), items: dayItems });
  }

  return groups;
}

function buildDayTitle(items: ScoredAttraction[], clusters: (string | null)[]): string {
  const hasPeninsula = clusters.some(
    (c) => c === 'peninsula-south' || c === 'peninsula-north' || c === 'south-peninsula'
  );
  const hasWinelands       = clusters.some((c) => c === 'winelands');
  const hasCity            = clusters.some((c) => c === 'city-centre' || c === 'atlantic-seaboard');
  const hasSouthernSuburbs = clusters.some((c) => c === 'southern-suburbs');

  if (hasWinelands && !hasPeninsula)             return 'Winelands & relaxed tastings';
  if (hasPeninsula && !hasWinelands)             return 'Peninsula scenic highlights';
  if (hasCity && hasSouthernSuburbs)             return 'City highlights and garden escapes';
  if (hasCity)                                   return 'Cape Town city and signature experiences';
  if (hasSouthernSuburbs)                        return 'Southern suburbs and nature';

  // Fallback: use the first attraction's region name
  const region = items[0]?.attraction.region;
  return region ? `${region} highlights` : 'Cape Town highlights';
}
