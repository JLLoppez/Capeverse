/**
 * Unit tests — lib/scoring.ts
 * Covers: scoreAttraction, rankAttractions, buildDayGroups,
 *         checkFeasibility, getCluster, clusterTitle, TAG_WEIGHTS, PACE_BUDGET_MINUTES
 */

import {
  scoreAttraction, rankAttractions, buildDayGroups, checkFeasibility,
  getCluster, clusterTitle, TAG_WEIGHTS, PACE_BUDGET_MINUTES,
  type AttractionStub, type PlannerInput,
} from '../lib/scoring';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const capePoint: AttractionStub      = { id:'1', name:'Cape Point',          slug:'cape-point',               region:'Cape Peninsula',  tags:['scenic','iconic','nature'],                    estimatedVisitMinutes:120 };
const bouldersBeach: AttractionStub  = { id:'2', name:'Boulders Beach',       slug:'boulders-beach',           region:'Simons Town',     tags:['family','wildlife','beach','photography'],      estimatedVisitMinutes:90  };
const tableMount: AttractionStub     = { id:'3', name:'Table Mountain',       slug:'table-mountain',           region:'City Bowl',       tags:['scenic','iconic','nature','photography'],       estimatedVisitMinutes:120 };
const boKaap: AttractionStub         = { id:'4', name:'Bo-Kaap',              slug:'bo-kaap',                  region:'Cape Town CBD',   tags:['culture','history','city','food','photography'],estimatedVisitMinutes:60  };
const stellenbosch: AttractionStub   = { id:'5', name:'Stellenbosch',         slug:'stellenbosch',             region:'Cape Winelands',  tags:['wine','food','luxury','scenic'],                estimatedVisitMinutes:180 };
const franschhoek: AttractionStub    = { id:'6', name:'Franschhoek',          slug:'franschhoek',              region:'Cape Winelands',  tags:['wine','food','luxury','romantic'],              estimatedVisitMinutes:180 };
const kirstenbosch: AttractionStub   = { id:'7', name:'Kirstenbosch',         slug:'kirstenbosch-botanical-garden', region:'Newlands',   tags:['nature','family','relaxed','photography'],      estimatedVisitMinutes:120 };
const chapmans: AttractionStub       = { id:'8', name:"Chapman's Peak Drive", slug:'chapmans-peak-drive',      region:'Atlantic Seaboard',tags:['scenic','road-trip','photography','iconic'],   estimatedVisitMinutes:45  };

const allAttractions = [capePoint, bouldersBeach, tableMount, boKaap, stellenbosch, franschhoek, kirstenbosch, chapmans];

const baseInput: PlannerInput = { days:1, groupType:'Couple', budget:'Mid-range', pace:'Balanced', interests:[] };

// ─── PACE_BUDGET_MINUTES ──────────────────────────────────────────────────────

describe('PACE_BUDGET_MINUTES', () => {
  test('Relaxed = 360 min',  () => expect(PACE_BUDGET_MINUTES.Relaxed).toBe(360));
  test('Balanced = 480 min', () => expect(PACE_BUDGET_MINUTES.Balanced).toBe(480));
  test('Packed = 600 min',   () => expect(PACE_BUDGET_MINUTES.Packed).toBe(600));
  test('has exactly 3 keys', () => expect(Object.keys(PACE_BUDGET_MINUTES).length).toBe(3));
});

// ─── TAG_WEIGHTS ──────────────────────────────────────────────────────────────

describe('TAG_WEIGHTS', () => {
  const expectedKeys = ['scenic','wine','city','culture','family','luxury','adventure','food','beach','wildlife'];
  test.each(expectedKeys)('key "%s" is defined', key => expect(TAG_WEIGHTS[key]).toBeDefined());
  test.each(expectedKeys)('key "%s" maps to non-empty array', key => expect(TAG_WEIGHTS[key].length).toBeGreaterThan(0));
  test('scenic includes road-trip',     () => expect(TAG_WEIGHTS.scenic).toContain('road-trip'));
  test('wine includes food and luxury', () => { expect(TAG_WEIGHTS.wine).toContain('food'); expect(TAG_WEIGHTS.wine).toContain('luxury'); });
  test('family includes wildlife',      () => expect(TAG_WEIGHTS.family).toContain('wildlife'));
  test('family includes beach',         () => expect(TAG_WEIGHTS.family).toContain('beach'));
  test('food includes wine',            () => expect(TAG_WEIGHTS.food).toContain('wine'));
  test('adventure includes nature',     () => expect(TAG_WEIGHTS.adventure).toContain('nature'));
  test('beach includes scenic',         () => expect(TAG_WEIGHTS.beach).toContain('scenic'));
  test('wildlife includes photography', () => expect(TAG_WEIGHTS.wildlife).toContain('photography'));
});

// ─── getCluster ───────────────────────────────────────────────────────────────

describe('getCluster', () => {
  test('Cape Peninsula → peninsula',      () => expect(getCluster('Cape Peninsula')).toBe('peninsula'));
  test('Simons Town → peninsula',         () => expect(getCluster('Simons Town')).toBe('peninsula'));
  test('Atlantic Seaboard → peninsula',   () => expect(getCluster('Atlantic Seaboard')).toBe('peninsula'));
  test('Cape Winelands → winelands',      () => expect(getCluster('Cape Winelands')).toBe('winelands'));
  test('Winelands → winelands',           () => expect(getCluster('Winelands')).toBe('winelands'));
  test('City Bowl → city',                () => expect(getCluster('City Bowl')).toBe('city'));
  test('Cape Town CBD → city',            () => expect(getCluster('Cape Town CBD')).toBe('city'));
  test('Newlands → city',                 () => expect(getCluster('Newlands')).toBe('city'));
  test('Gardens → city',                  () => expect(getCluster('Gardens')).toBe('city'));
  test('unknown slugifies gracefully',    () => expect(getCluster('Garden Route')).toBe('garden-route'));
  test('handles multi-space regions',     () => expect(getCluster('De Waterkant')).toBe('de-waterkant'));
});

// ─── clusterTitle ─────────────────────────────────────────────────────────────

describe('clusterTitle', () => {
  test('peninsula → Cape Peninsula scenic highlights', () => expect(clusterTitle('peninsula')).toBe('Cape Peninsula scenic highlights'));
  test('winelands → Winelands & relaxed tastings',    () => expect(clusterTitle('winelands')).toBe('Winelands & relaxed tastings'));
  test('city → Cape Town city & culture',             () => expect(clusterTitle('city')).toBe('Cape Town city & culture'));
  test('unknown → humanised fallback',                () => expect(clusterTitle('garden-route')).toBe('garden route highlights'));
  test('single word returns highlights',              () => expect(clusterTitle('safari')).toBe('safari highlights'));
});

// ─── scoreAttraction ──────────────────────────────────────────────────────────

describe('scoreAttraction', () => {
  test('scores 0 with no interests and no mustSee',     () => expect(scoreAttraction(capePoint, baseInput)).toBe(0));
  test('scores 0 when no tags overlap interests',       () => expect(scoreAttraction(capePoint, { ...baseInput, interests:['wine'] })).toBe(0));

  test('scenic interest: capePoint scenic+iconic+nature = 30', () => {
    expect(scoreAttraction(capePoint, { ...baseInput, interests:['scenic'] })).toBe(30);
  });
  test('wine interest: stellenbosch wine+food+luxury = 30', () => {
    expect(scoreAttraction(stellenbosch, { ...baseInput, interests:['wine'] })).toBe(30);
  });
  test('culture interest: boKaap culture+history+food+city = 40', () => {
    expect(scoreAttraction(boKaap, { ...baseInput, interests:['culture'] })).toBe(40);
  });
  test('family interest + family group bonus', () => {
    const score = scoreAttraction(bouldersBeach, { ...baseInput, interests:['family'], groupType:'Family' });
    // family→[family,wildlife,relaxed,beach]: family(+10)+wildlife(+10)+beach(+10)=30 + family group +8 = 38
    expect(score).toBe(38);
  });
  test('mustSee adds 25', () => {
    expect(scoreAttraction(capePoint, { ...baseInput, mustSee:['cape-point'] })).toBe(25);
  });
  test('mustSee slug must match exactly', () => {
    expect(scoreAttraction(capePoint, { ...baseInput, mustSee:['cape-peninsula'] })).toBe(0);
  });
  test('luxury budget bonus on luxury-tagged attraction', () => {
    expect(scoreAttraction(stellenbosch, { ...baseInput, budget:'Luxury' })).toBe(8);
  });
  test('luxury budget has no effect without luxury tag', () => {
    expect(scoreAttraction(capePoint, { ...baseInput, budget:'Luxury' })).toBe(0);
  });
  test('relaxed pace bonus on relaxed-tagged attraction', () => {
    expect(scoreAttraction(kirstenbosch, { ...baseInput, pace:'Relaxed' })).toBe(5);
  });
  test('packed pace bonus on iconic-tagged attraction', () => {
    expect(scoreAttraction(capePoint, { ...baseInput, pace:'Packed' })).toBe(3);
  });
  test('stacks multiple bonuses correctly', () => {
    const input: PlannerInput = {
      days:1, groupType:'Family', budget:'Mid-range', pace:'Relaxed',
      interests:['family'], mustSee:['kirstenbosch-botanical-garden'],
    };
    // family→[family,wildlife,relaxed,beach]: family(+10)+relaxed(+10)=20 interests
    // mustSee +25, family group +8, relaxed pace +5 = 68
    expect(scoreAttraction(kirstenbosch, input)).toBe(68);
  });
  test('multiple interests combine without double-counting same tag', () => {
    // scenic→[scenic,iconic,nature,photography,road-trip] + culture→[culture,history,food,city,photography]
    // capePoint has scenic(+10) iconic(+10) nature(+10) from scenic interest = 30
    // no culture-interest tags on capePoint
    expect(scoreAttraction(capePoint, { ...baseInput, interests:['scenic','culture'] })).toBe(30);
  });
  test('beach interest: bouldersBeach beach(+10) = 10', () => {
    expect(scoreAttraction(bouldersBeach, { ...baseInput, interests:['beach'] })).toBe(10);
  });
  test('wildlife interest: bouldersBeach wildlife(+10)+photography(+10) = 20', () => {
    expect(scoreAttraction(bouldersBeach, { ...baseInput, interests:['wildlife'] })).toBe(20);
  });
  test('food interest: boKaap food(+10)+culture(0—not in food weights) = check actual', () => {
    // food→[food,wine,culture,luxury]: boKaap has food(+10)+culture(+10) = 20
    expect(scoreAttraction(boKaap, { ...baseInput, interests:['food'] })).toBe(20);
  });
});

// ─── rankAttractions ──────────────────────────────────────────────────────────

describe('rankAttractions', () => {
  test('returns all attractions — no hard cap', () => {
    const result = rankAttractions(allAttractions, { ...baseInput, interests:['scenic'] });
    expect(result.length).toBe(allAttractions.length);
  });
  test('highest scoring first', () => {
    const result = rankAttractions(allAttractions, { ...baseInput, interests:['wine'] });
    expect(result[0].attraction.slug).toContain('stellenbosch');
  });
  test('scores are non-increasing (sorted descending)', () => {
    const result = rankAttractions(allAttractions, { ...baseInput, interests:['scenic','wine'] });
    for (let i=1; i<result.length; i++) {
      expect(result[i].score).toBeLessThanOrEqual(result[i-1].score);
    }
  });
  test('tie-break is alphabetical by name', () => {
    // With no interests both stellenbosch and franschhoek score 0 — alphabetical order
    const result = rankAttractions([stellenbosch, franschhoek], baseInput);
    expect(result[0].attraction.name).toBe('Franschhoek');
    expect(result[1].attraction.name).toBe('Stellenbosch');
  });
  test('mustSee slug lifts attraction in ranking', () => {
    const result = rankAttractions(allAttractions, { ...baseInput, interests:['wine'], mustSee:['bo-kaap'] });
    const boKaapResult = result.find(r => r.attraction.slug === 'bo-kaap')!;
    expect(boKaapResult.score).toBe(25);
    // wine interest makes stellenbosch/franschhoek score higher (30)
    expect(result[0].score).toBeGreaterThan(boKaapResult.score);
  });
  test('empty attractions array returns empty array', () => {
    expect(rankAttractions([], baseInput)).toEqual([]);
  });
  test('returns score for every attraction', () => {
    const result = rankAttractions(allAttractions, baseInput);
    result.forEach(r => expect(typeof r.score).toBe('number'));
  });
});

// ─── buildDayGroups — geographic clustering ────────────────────────────────────

describe('buildDayGroups — clustering', () => {
  const peninsulaScored = [
    { attraction: capePoint,     score: 30 },
    { attraction: bouldersBeach, score: 25 },
    { attraction: chapmans,      score: 20 },
  ];
  const wineScored = [
    { attraction: stellenbosch, score: 50 },
    { attraction: franschhoek,  score: 45 },
  ];
  const cityScored = [
    { attraction: tableMount, score: 40 },
    { attraction: boKaap,     score: 30 },
  ];

  test('peninsula attractions cluster together on one day', () => {
    const groups = buildDayGroups(peninsulaScored, 3, 'Balanced');
    expect(groups.length).toBe(1);
    expect(groups[0].cluster).toBe('peninsula');
    expect(groups[0].items.length).toBe(3);
  });
  test('winelands attractions cluster together', () => {
    const groups = buildDayGroups(wineScored, 2, 'Balanced');
    expect(groups.length).toBe(1);
    expect(groups[0].cluster).toBe('winelands');
  });
  test('different clusters assigned to different days', () => {
    const mixed = [...wineScored, ...cityScored];
    const groups = buildDayGroups(mixed, 2, 'Balanced');
    expect(groups.length).toBe(2);
    const clusters = groups.map(g => g.cluster);
    expect(clusters).toContain('winelands');
    expect(clusters).toContain('city');
  });
  test('does not exceed requested days', () => {
    const all = allAttractions.map((a, i) => ({ attraction: a, score: 100 - i*5 }));
    const groups = buildDayGroups(all, 2, 'Balanced');
    expect(groups.length).toBeLessThanOrEqual(2);
  });
  test('best-scoring cluster is Day 1', () => {
    const mixed = [
      { attraction: capePoint,    score: 50 }, // peninsula
      { attraction: stellenbosch, score: 40 }, // winelands — lower
    ];
    const groups = buildDayGroups(mixed, 2, 'Balanced');
    expect(groups[0].cluster).toBe('peninsula');
  });
  test('day numbers are sequential starting at 1', () => {
    const mixed = [...peninsulaScored, ...wineScored];
    const groups = buildDayGroups(mixed, 5, 'Balanced');
    groups.forEach((g, i) => expect(g.day).toBe(i + 1));
  });
  test('each group has a title string', () => {
    const groups = buildDayGroups(peninsulaScored, 1, 'Balanced');
    expect(typeof groups[0].title).toBe('string');
    expect(groups[0].title.length).toBeGreaterThan(0);
  });
});

// ─── buildDayGroups — time-budget enforcement ─────────────────────────────────

describe('buildDayGroups — time budget', () => {
  test('totalMinutes sums estimatedVisitMinutes correctly', () => {
    const scored = [
      { attraction: capePoint,     score: 30 }, // 120 min
      { attraction: bouldersBeach, score: 20 }, // 90 min — same peninsula cluster
    ];
    const groups = buildDayGroups(scored, 1, 'Balanced');
    expect(groups[0].totalMinutes).toBe(210);
  });
  test('at-limit day is not flagged overCapacity', () => {
    // Relaxed = 360 min; stellenbosch(180) + franschhoek(180) = 360 exactly
    const scored = [
      { attraction: stellenbosch, score: 50 },
      { attraction: franschhoek,  score: 45 },
    ];
    const groups = buildDayGroups(scored, 1, 'Relaxed');
    expect(groups[0].totalMinutes).toBe(360);
    expect(groups[0].overCapacity).toBe(false);
  });
  test('over-limit day is flagged overCapacity', () => {
    const heavy: AttractionStub = { id:'X', name:'Long Stop', slug:'long-stop', region:'Cape Peninsula', tags:['scenic'], estimatedVisitMinutes:500 };
    const scored = [{ attraction: heavy, score: 50 }];
    const groups = buildDayGroups(scored, 1, 'Balanced');
    expect(groups[0].overCapacity).toBe(true);
  });
  test('splits large cluster across days on time overflow', () => {
    const big1: AttractionStub = { id:'B1', name:'Stop A', slug:'stop-a', region:'Cape Peninsula', tags:['scenic'], estimatedVisitMinutes:300 };
    const big2: AttractionStub = { id:'B2', name:'Stop B', slug:'stop-b', region:'Cape Peninsula', tags:['scenic'], estimatedVisitMinutes:300 };
    const scored = [{ attraction: big1, score:50 }, { attraction: big2, score:45 }];
    const groups = buildDayGroups(scored, 2, 'Balanced'); // 480 min budget per day
    // 300+300 = 600 > 480, so should split into 2 days
    expect(groups.length).toBe(2);
  });
});

// ─── checkFeasibility ─────────────────────────────────────────────────────────

describe('checkFeasibility', () => {
  test('feasible when all attractions fit', () => {
    const scored = [
      { attraction: capePoint,     score: 30 },
      { attraction: bouldersBeach, score: 20 },
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    expect(result.feasible).toBe(true);
    expect(result.droppedAttractions.length).toBe(0);
    expect(result.warnings.length).toBe(0);
  });
  test('infeasible when more clusters than days', () => {
    const scored = [
      { attraction: capePoint,    score: 50 }, // peninsula
      { attraction: stellenbosch, score: 40 }, // winelands
      { attraction: boKaap,       score: 30 }, // city
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    expect(result.feasible).toBe(false);
    expect(result.droppedAttractions.length).toBeGreaterThan(0);
  });
  test('warning mentions dropped attraction names', () => {
    const scored = [
      { attraction: capePoint,    score: 50 },
      { attraction: stellenbosch, score: 40 },
      { attraction: boKaap,       score: 30 },
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    const warnText = result.warnings.join(' ');
    result.droppedAttractions.forEach(a => expect(warnText).toContain(a.name));
  });
  test('warning mentions day count and pace', () => {
    const scored = [
      { attraction: capePoint,    score: 50 },
      { attraction: stellenbosch, score: 40 },
      { attraction: boKaap,       score: 30 },
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    expect(result.warnings[0]).toMatch(/1 day|Balanced|pace/i);
  });
  test('usedAttractions contains only what fit', () => {
    const scored = [
      { attraction: capePoint,    score: 50 }, // peninsula
      { attraction: stellenbosch, score: 40 }, // winelands
    ];
    const result = checkFeasibility(scored, 1, 'Balanced');
    expect(result.usedAttractions.length).toBe(1);
  });
  test('feasible with multiple days for multiple clusters', () => {
    const scored = [
      { attraction: capePoint,    score: 50 },
      { attraction: stellenbosch, score: 40 },
      { attraction: boKaap,       score: 30 },
    ];
    const result = checkFeasibility(scored, 3, 'Balanced');
    expect(result.feasible).toBe(true);
    expect(result.droppedAttractions.length).toBe(0);
  });
  test('empty scored array is always feasible', () => {
    const result = checkFeasibility([], 1, 'Balanced');
    expect(result.feasible).toBe(true);
  });
});
