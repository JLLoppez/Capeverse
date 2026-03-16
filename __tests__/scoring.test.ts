/**
 * Unit tests for lib/scoring.ts
 * Run with: npx jest
 */

import { scoreAttraction, rankAttractions, buildDayGroups, TAG_WEIGHTS, type AttractionStub, type PlannerInput } from '../lib/scoring';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const capePoint: AttractionStub = {
  id: '1',
  name: 'Cape Point',
  slug: 'cape-point',
  region: 'Cape Peninsula',
  tags: ['scenic', 'iconic', 'nature']
};

const stellenbosch: AttractionStub = {
  id: '2',
  name: 'Stellenbosch Wine Route',
  slug: 'stellenbosch',
  region: 'Winelands',
  tags: ['wine', 'food', 'romantic']
};

const boKaap: AttractionStub = {
  id: '3',
  name: 'Bo-Kaap',
  slug: 'bo-kaap',
  region: 'Cape Town City',
  tags: ['culture', 'history', 'city']
};

const bouldersBeach: AttractionStub = {
  id: '4',
  name: 'Boulders Beach',
  slug: 'boulders-beach',
  region: 'Cape Peninsula',
  tags: ['family', 'wildlife', 'scenic']
};

const kirstenbosch: AttractionStub = {
  id: '5',
  name: 'Kirstenbosch',
  slug: 'kirstenbosch',
  region: 'Cape Town City',
  tags: ['family', 'relaxed', 'nature']
};

const allAttractions = [capePoint, stellenbosch, boKaap, bouldersBeach, kirstenbosch];

// ─── scoreAttraction ─────────────────────────────────────────────────────────

describe('scoreAttraction', () => {
  test('scores 0 for an attraction with no tag overlap', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced',
      interests: ['wine']
    };
    // Cape Point has no wine/food/luxury/romantic tags
    expect(scoreAttraction(capePoint, input)).toBe(0);
  });

  test('scores based on interest → tag weight expansion', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced',
      interests: ['scenic']
    };
    // scenic maps to ['scenic', 'iconic', 'nature', 'photography']
    // capePoint has scenic, iconic, nature → 3 × 10 = 30
    expect(scoreAttraction(capePoint, input)).toBe(30);
  });

  test('mustSee bonus adds 25 points', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced',
      interests: [], mustSee: ['cape-point']
    };
    expect(scoreAttraction(capePoint, input)).toBe(25);
  });

  test('family group bonus applies when attraction has family tag', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Family with Kids', budget: 'Mid-range', pace: 'Balanced',
      interests: []
    };
    expect(scoreAttraction(bouldersBeach, input)).toBe(8);
    expect(scoreAttraction(capePoint, input)).toBe(0); // no family tag
  });

  test('luxury budget bonus applies when attraction has luxury tag', () => {
    const luxuryAttraction: AttractionStub = {
      id: '99', name: 'Private Wine Estate', slug: 'private-estate',
      region: 'Winelands', tags: ['luxury', 'wine', 'romantic']
    };
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Luxury', pace: 'Balanced',
      interests: []
    };
    expect(scoreAttraction(luxuryAttraction, input)).toBe(8);
  });

  test('relaxed pace bonus applies when attraction has relaxed tag', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Relaxed',
      interests: []
    };
    expect(scoreAttraction(kirstenbosch, input)).toBe(5);
    expect(scoreAttraction(capePoint, input)).toBe(0);
  });

  test('stacks multiple bonuses correctly', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Family', budget: 'Mid-range', pace: 'Relaxed',
      interests: ['family'], mustSee: ['kirstenbosch']
    };
    // family interest → TAG_WEIGHTS.family = ['family','wildlife','relaxed']
    // kirstenbosch tags: family (+10), relaxed (+10) = 20 from interests
    // mustSee: +25
    // family group + family tag: +8
    // relaxed pace + relaxed tag: +5
    // total = 58
    expect(scoreAttraction(kirstenbosch, input)).toBe(58);
  });
});

// ─── rankAttractions ─────────────────────────────────────────────────────────

describe('rankAttractions', () => {
  test('returns highest scoring attractions first', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced',
      interests: ['wine']
    };
    const result = rankAttractions(allAttractions, input);
    expect(result[0].attraction.slug).toBe('stellenbosch');
  });

  test('respects days × 3 slice limit', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced',
      interests: ['scenic']
    };
    const result = rankAttractions(allAttractions, input);
    // days=1 → max(3, 1*3) = 3
    expect(result.length).toBeLessThanOrEqual(3);
  });

  test('returns at least 3 results when enough attractions exist', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced',
      interests: []
    };
    const result = rankAttractions(allAttractions, input);
    expect(result.length).toBe(3);
  });

  test('mustSee attraction appears near the top regardless of tag score', () => {
    const input: PlannerInput = {
      days: 1, groupType: 'Couple', budget: 'Mid-range', pace: 'Balanced',
      interests: ['wine'], mustSee: ['bo-kaap']  // bo-kaap has no wine tags but has mustSee
    };
    const result = rankAttractions(allAttractions, input);
    const boKaapResult = result.find((r) => r.attraction.slug === 'bo-kaap');
    expect(boKaapResult).toBeDefined();
    expect(boKaapResult!.score).toBe(25);
  });
});

// ─── buildDayGroups ───────────────────────────────────────────────────────────

describe('buildDayGroups', () => {
  const scoredFixture = [
    { attraction: capePoint, score: 30 },
    { attraction: boKaap, score: 20 },
    { attraction: kirstenbosch, score: 15 },
    { attraction: stellenbosch, score: 10 },
    { attraction: bouldersBeach, score: 5 }
  ];

  test('groups stops into the correct number of days', () => {
    const groups = buildDayGroups(scoredFixture, 2);
    expect(groups.length).toBe(2);
    expect(groups[0].day).toBe(1);
    expect(groups[1].day).toBe(2);
  });

  test('assigns Peninsula title when Cape Point or Boulders Beach is in the day', () => {
    const groups = buildDayGroups(scoredFixture, 1);
    expect(groups[0].title).toBe('Peninsula scenic highlights');
  });

  test('assigns Winelands title when a Winelands region attraction is present', () => {
    const winelandsFirst = [
      { attraction: stellenbosch, score: 50 },
      { attraction: boKaap, score: 10 },
      { attraction: kirstenbosch, score: 5 }
    ];
    const groups = buildDayGroups(winelandsFirst, 1);
    expect(groups[0].title).toBe('Winelands & relaxed tastings');
  });

  test('falls back to generic city title when no peninsula or winelands', () => {
    const cityOnly = [
      { attraction: boKaap, score: 20 },
      { attraction: kirstenbosch, score: 10 },
      { attraction: { id: '6', name: 'V&A Waterfront', slug: 'va-waterfront', region: 'Cape Town City', tags: ['city'] }, score: 5 }
    ];
    const groups = buildDayGroups(cityOnly, 1);
    expect(groups[0].title).toBe('Cape Town city and signature experiences');
  });

  test('skips empty days rather than including blank groups', () => {
    // Only 3 scored items but requesting 3 days → day 2 and 3 would be empty
    const sparse = [
      { attraction: capePoint, score: 30 },
      { attraction: boKaap, score: 20 },
      { attraction: kirstenbosch, score: 10 }
    ];
    const groups = buildDayGroups(sparse, 3);
    // Day 1 gets all 3, days 2 and 3 are empty → only 1 group
    expect(groups.length).toBe(1);
  });
});

// ─── TAG_WEIGHTS sanity ───────────────────────────────────────────────────────

describe('TAG_WEIGHTS', () => {
  test('every interest key maps to a non-empty array of tags', () => {
    for (const [key, tags] of Object.entries(TAG_WEIGHTS)) {
      expect(Array.isArray(tags)).toBe(true);
      expect(tags.length).toBeGreaterThan(0);
    }
  });

  test('wine interest includes food and luxury tags', () => {
    expect(TAG_WEIGHTS.wine).toContain('food');
    expect(TAG_WEIGHTS.wine).toContain('luxury');
  });

  test('family interest includes wildlife tag', () => {
    expect(TAG_WEIGHTS.family).toContain('wildlife');
  });
});
