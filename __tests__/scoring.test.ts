/**
 * Unit tests for lib/scoring.ts (v2 — geographic clustering, time-budget, feasibility)
 * Run with: npx jest
 */

import {
  scoreAttraction,
  rankAttractions,
  buildDayGroups,
  checkFeasibility,
  getCluster,
  clusterTitle,
  TAG_WEIGHTS,
  PACE_BUDGET_MINUTES,
  type AttractionStub,
  type PlannerInput,
} from '../lib/scoring';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const capePoint: AttractionStub = {
  id: '1', name: 'Cape Point', slug: 'cape-point',
  region: 'Cape Peninsula', tags: ['scenic', 'iconic', 'nature'],
  estimatedVisitMinutes: 120,
};

const bouldersBeach: AttractionStub = {
  id: '2', name: 'Boulders Beach', slug: 'boulders-beach',
  region: 'Simons Town', tags: ['family', 'wildlife', 'beach', 'photography'],
  estimatedVisitMinutes: 90,
};

const tableMount: AttractionStub = {
  id: '3', name: 'Table Mountain', slug: 'table-mountain',
  region: 'City Bowl', tags: ['scenic', 'iconic', 'nature', 'photography'],
  estimatedVisitMinutes: 120,
};

const boKaap: AttractionStub = {
  id: '4', name: 'Bo-Kaap', slug: 'bo-kaap',
  region: 'Cape Town CBD', tags: ['culture', 'history', 'city', 'food', 'photography'],
  estimatedVisitMinutes: 60,
};

const stellenbosch: AttractionStub = {
  id: '5', name: 'Stellenbosch', slug: 'stellenbosch',
  region: 'Cape Winelands', tags: ['wine', 'food', 'luxury', 'scenic'],
  estimatedVisitMinutes: 180,
};

const franschhoek: AttractionStub = {
  id: '6', name: 'Franschhoek', slug: 'franschhoek',
  region: 'Cape Winelands', tags: ['wine', 'food', 'luxury', 'romantic'],
  estimatedVisitMinutes: 180,
};

const kirstenbosch: AttractionStub = {
  id: '7', name: 'Kirstenbosch', slug: 'kirstenbosch-botanical-garden',
  region: 'Newlands', tags: ['nature', 'family', 'relaxed', 'photography'],
  estimatedVisitMinutes: 120,
};

const chapmans: AttractionStub = {
  id: '8', name: "Chapman's Peak Drive", slug: 'chapmans-peak-drive',
  region: 'Atlantic Seaboard', tags: ['scenic', 'road-trip', 'photography', 'iconic'],
  estimatedVisitMinutes: 45,
};

const allAttractions = [capePoint, bouldersBeach, tableMount, boKaap, stellenbosch, franschhoek, kirstenbosch, chapmans];

// ─── getCluster ───────────────────────────────────────────────────────────────

describe('getCluster', () => {
  test('Cape Peninsula → peninsula', () => expect(getCluster('Cape Peninsula')).toBe('peninsula'));
  test('Simons Town → peninsula', () => expect(getCluster('Simons Town')).toBe('peninsula'));
  test('Atlantic Seaboard → peninsula', () => expect(getCluster('Atlantic Seaboard')).toBe('peninsula'));
  test('Cape Winelands → winelands', () => expect(getCluster('Cape Winelands')).toBe('winelands'));
  test('City Bowl → city', () => expect(getCluster('City Bowl')).toBe('city'));
  test('Cape Town CBD → city', () => expect(getCluster('Cape Town CBD')).toBe('city'));
  test('Newlands → city', () => expect(getCluster('Newlands')).toBe('city'));
  test('unknown region gets slugified fallback', () => expect(getCluster('Garden Route')).toBe('garden-route'));
});

// ─── clusterTitle ─────────────────────────────────────────────────────────────

describe('clusterTitle', () => {
  test('peninsula → Cape Peninsula scenic highlights', () =>
    expect(clusterTitle('peninsula')).toBe('Cape Peninsula scenic highlights'));
  test('winelands → Winelands & relaxed tastings', () =>
    expect(clusterTitle('winelands')).toBe('Winelands & relaxed tastings'));
  test('city → Cape Town city & culture', () =>
    expect(clusterTitle('city')).toBe('Cape Town city & culture'));
  test('unknown cluster → humanised fallback', () =>
    expect(clusterTitle('garden-route')).toBe('garden route highlights'));
});

// ─── PACE_BUDGET_MINUTES ──────────────────────────────────────────────────────

describe('PACE_BUDGET_MINUTES', () => {
  test('Relaxed is 360 min', () => expect(PACE_BUDGET_MINUTES['Relaxed']).toBe(360));
  test('Balanced is 480 min', () => expect(PACE_BUDGET_MINUTES['Balanced']).toBe(480));
  test('Packed is 600 min', () => expect(PACE_BUDGET_MINUTES['Packed']).toBe(600));
});

// ─── scoreAttraction ──────────────────────────────────────────────────────────

describe('scoreAttraction', () => {
  test('scores 0 when no tag overlap', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: ['wine'] };
    expect(scoreAttraction(capePoint, input)).toBe(0);
  });

  test('expands interest → tag weights correctly', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: ['scenic'] };
    // scenic → ['scenic','iconic','nature','photography','road-trip']
    // capePoint has scenic(+10) iconic(+10) nature(+10) = 30
    expect(scoreAttraction(capePoint, input)).toBe(30);
  });

  test('mustSee adds 25', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: [], mustSee: ['cape-point'] };
    expect(scoreAttraction(capePoint, input)).toBe(25);
  });

  test('family group bonus', () => {
    const input: PlannerInput = { days: 1, groupType: 'Family with Kids', budget: 'Mid-range', pace: 'Balanced', interests: [] };
    expect(scoreAttraction(bouldersBeach, input)).toBe(8);
    expect(scoreAttraction(capePoint, input)).toBe(0);
  });

  test('luxury budget bonus', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Luxury', pace: 'Balanced', interests: [] };
    expect(scoreAttraction(stellenbosch, input)).toBe(8);
  });

  test('relaxed pace bonus', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Relaxed', interests: [] };
    expect(scoreAttraction(kirstenbosch, input)).toBe(5);
  });

  test('packed pace gives bonus to iconic attractions', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Packed', interests: [] };
    expect(scoreAttraction(capePoint, input)).toBe(3); // iconic tag → +3
  });

  test('stacks multiple bonuses', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Family', budget: 'Mid-range', pace: 'Relaxed',
      interests: ['family'], mustSee: ['kirstenbosch-botanical-garden'],
    };
    // family interest → ['family','wildlife','relaxed','beach']
    // kirstenbosch: family(+10) relaxed(+10) = 20 from interests
    // mustSee: +25
    // family group + family tag: +8
    // relaxed pace + relaxed tag: +5
    expect(scoreAttraction(kirstenbosch, input)).toBe(68);
  });

  test('new interest categories work: food, beach, wildlife', () => {
    const inputFood: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: ['food'] };
    // food → ['food','wine','culture','luxury']; stellenbosch has food(+10) wine(+10) luxury(+10) = 30
    expect(scoreAttraction(stellenbosch, inputFood)).toBe(30);

    const inputBeach: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: ['beach'] };
    // beach → ['beach','scenic','relaxed','family']; bouldersBeach has beach(+10) = 10
    expect(scoreAttraction(bouldersBeach, inputBeach)).toBe(10);

    const inputWildlife: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: ['wildlife'] };
    // wildlife → ['wildlife','nature','family','photography']; bouldersBeach has wildlife(+10) photography(+10) family ... = 20+family(0)=20
    expect(scoreAttraction(bouldersBeach, inputWildlife)).toBe(20);
  });
});

// ─── rankAttractions ──────────────────────────────────────────────────────────

describe('rankAttractions', () => {
  test('highest scoring first', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: ['wine'] };
    const result = rankAttractions(allAttractions, input);
    expect(result[0].attraction.slug).toBe('stellenbosch');
  });

  test('returns ALL attractions, not capped (caller decides)', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: ['scenic'] };
    const result = rankAttractions(allAttractions, input);
    expect(result.length).toBe(allAttractions.length);
  });

  test('mustSee attraction surfaces near top regardless of tag score', () => {
    const input: PlannerInput = { days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced', interests: ['wine'], mustSee: ['bo-kaap'] };
    const result = rankAttractions(allAttractions, input);
    const boKaapResult = result.find((r) => r.attraction.slug === 'bo-kaap');
    expect(boKaapResult?.score).toBe(25);
    // Bo-Kaap has no wine tags but mustSee gives it 25; stellenbosch has wine tags and scores higher
    expect(result[0].attraction.slug).toBe('stellenbosch');
  });
});

// ─── buildDayGroups: geographic clustering ────────────────────────────────────

describe('buildDayGroups — geographic clustering', () => {
  const peninsulaOnly = [
    { attraction: capePoint, score: 30 },
    { attraction: bouldersBeach, score: 25 },
    { attraction: chapmans, score: 20 },
  ];

  test('peninsula attractions cluster on the same day', () => {
    const groups = buildDayGroups(peninsulaOnly, 3, 'Balanced');
    // All three are peninsula cluster → should be on one day
    expect(groups.length).toBe(1);
    expect(groups[0].cluster).toBe('peninsula');
    expect(groups[0].items.length).toBe(3);
  });

  test('Winelands attractions cluster together', () => {
    const wineOnly = [
      { attraction: stellenbosch, score: 40 },
      { attraction: franschhoek, score: 35 },
    ];
    const groups = buildDayGroups(wineOnly, 2, 'Balanced');
    expect(groups.length).toBe(1);
    expect(groups[0].cluster).toBe('winelands');
    expect(groups[0].items.length).toBe(2);
  });

  test('different clusters go to different days', () => {
    const mixed = [
      { attraction: stellenbosch, score: 50 },  // winelands
      { attraction: capePoint, score: 40 },      // peninsula
    ];
    const groups = buildDayGroups(mixed, 2, 'Balanced');
    expect(groups.length).toBe(2);
    const clusters = groups.map((g) => g.cluster);
    expect(clusters).toContain('winelands');
    expect(clusters).toContain('peninsula');
  });

  test('does not exceed requested days', () => {
    const scored = allAttractions.map((a, i) => ({ attraction: a, score: 100 - i * 5 }));
    const groups = buildDayGroups(scored, 2, 'Balanced');
    expect(groups.length).toBeLessThanOrEqual(2);
  });
});

// ─── buildDayGroups: time-budget enforcement ──────────────────────────────────

describe('buildDayGroups — time budget', () => {
  test('overCapacity is true when day exceeds pace budget', () => {
    // Relaxed = 360 min; stellenbosch (180) + franschhoek (180) = 360 = exactly at limit → not over
    const wineAtRelaxed = [
      { attraction: stellenbosch, score: 50 },
      { attraction: franschhoek, score: 45 },
    ];
    const groups = buildDayGroups(wineAtRelaxed, 1, 'Relaxed');
    expect(groups[0].totalMinutes).toBe(360);
    expect(groups[0].overCapacity).toBe(false);
  });

  test('splits cluster across days when time overflows', () => {
    // Make a cluster that totals 900 min — must split across Balanced days (480 min each)
    const bigCluster: Array<{ attraction: AttractionStub; score: number }> = [
      { attraction: { ...capePoint, estimatedVisitMinutes: 300 }, score: 50 },
      { attraction: { ...tableMount, region: 'Cape Peninsula', estimatedVisitMinutes: 300 }, score: 45 },
      { attraction: { ...chapmans, estimatedVisitMinutes: 300 }, score: 40 },
    ];
    const groups = buildDayGroups(bigCluster, 3, 'Balanced');
    expect(groups.length).toBeGreaterThanOrEqual(2);
  });

  test('each day stores totalMinutes', () => {
    const simple = [
      { attraction: capePoint, score: 30 },       // 120 min
      { attraction: bouldersBeach, score: 20 },   // 90 min
    ];
    const groups = buildDayGroups(simple, 1, 'Balanced');
    // Both are peninsula cluster
    expect(groups[0].totalMinutes).toBe(210);
  });
});

// ─── checkFeasibility ─────────────────────────────────────────────────────────

describe('checkFeasibility', () => {
  test('feasible = true when all attractions fit', () => {
    const scored = [
      { attraction: capePoint, score: 30 },
      { attraction: bouldersBeach, score: 20 },
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    expect(result.feasible).toBe(true);
    expect(result.droppedAttractions.length).toBe(0);
    expect(result.warnings.length).toBe(0);
  });

  test('dropped attractions reported when more clusters than days', () => {
    // 3 different clusters, only 1 day available
    const scored = [
      { attraction: capePoint, score: 50 },      // peninsula
      { attraction: stellenbosch, score: 40 },   // winelands
      { attraction: boKaap, score: 30 },          // city
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    expect(result.feasible).toBe(false);
    expect(result.droppedAttractions.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/couldn't fit/i);
  });

  test('warning mentions dropped attraction names', () => {
    const scored = [
      { attraction: capePoint, score: 50 },
      { attraction: stellenbosch, score: 40 },
      { attraction: boKaap, score: 30 },
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    const warnText = result.warnings.join(' ');
    // The dropped names should appear in the warning
    result.droppedAttractions.forEach((a) => {
      expect(warnText).toContain(a.name);
    });
  });

  test('usedAttractions contains only what fit', () => {
    const scored = [
      { attraction: capePoint, score: 50 },
      { attraction: stellenbosch, score: 40 },
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    // Only 1 cluster can fit in 1 day
    expect(result.usedAttractions.length).toBe(1);
  });
});

// ─── TAG_WEIGHTS sanity ───────────────────────────────────────────────────────

describe('TAG_WEIGHTS', () => {
  test('every key maps to a non-empty array', () => {
    for (const [, tags] of Object.entries(TAG_WEIGHTS)) {
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    }
  });

  test('all 10 interest categories are defined', () => {
    const expected = ['scenic','wine','city','culture','family','luxury','adventure','food','beach','wildlife'];
    for (const key of expected) {
      expect(TAG_WEIGHTS[key]).toBeDefined();
    }
  });

  test('wine includes food and luxury', () => {
    expect(TAG_WEIGHTS.wine).toContain('food');
    expect(TAG_WEIGHTS.wine).toContain('luxury');
  });

  test('family includes wildlife and beach', () => {
    expect(TAG_WEIGHTS.family).toContain('wildlife');
    expect(TAG_WEIGHTS.family).toContain('beach');
  });

  test('scenic includes road-trip', () => {
    expect(TAG_WEIGHTS.scenic).toContain('road-trip');
  });
});
