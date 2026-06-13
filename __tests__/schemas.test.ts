/**
 * Unit tests — lib/schemas.ts
 * Covers: EnquirySchema, ItineraryGenerateSchema, AIGenerateSchema
 */

import { EnquirySchema, ItineraryGenerateSchema, AIGenerateSchema } from '../lib/schemas';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const validEnquiry = {
  fullName: 'Jane Smith', email: 'jane@example.com',
  phone: null, nationality: null, travelDate: null,
  groupSize: null, budgetRange: null, tripLengthDays: null, message: null,
};

const cuid = (n = 0) => `clh${'abcdefghijklmnopqrstuv'.slice(n,n+20)}`;
const validItinerary = {
  attractionIds: [cuid(0), cuid(1)],
  days: 3, budget: 'Mid-range' as const,
  pace: 'Balanced' as const, groupType: 'Couple',
  interests: ['scenic'],
};

// ─── EnquirySchema ────────────────────────────────────────────────────────────

describe('EnquirySchema — valid inputs', () => {
  test('accepts minimal valid input',       () => expect(EnquirySchema.safeParse(validEnquiry).success).toBe(true));
  test('accepts full valid input', () => {
    expect(EnquirySchema.safeParse({
      ...validEnquiry, phone:'+27761234567', nationality:'German',
      travelDate:'2026-10-15', groupSize:'4', budgetRange:'Luxury',
      tripLengthDays:'7', message:'We love wine and penguins.',
    }).success).toBe(true);
  });
  test('transforms travelDate string to Date', () => {
    const r = EnquirySchema.safeParse({ ...validEnquiry, travelDate:'2026-10-15' });
    expect(r.success && r.data.travelDate).toBeInstanceOf(Date);
  });
  test('transforms groupSize string to number', () => {
    const r = EnquirySchema.safeParse({ ...validEnquiry, groupSize:'4' });
    expect(r.success && r.data.groupSize).toBe(4);
  });
  test('transforms tripLengthDays string to number', () => {
    const r = EnquirySchema.safeParse({ ...validEnquiry, tripLengthDays:'7' });
    expect(r.success && r.data.tripLengthDays).toBe(7);
  });
  test('accepts all optional fields as null', () => {
    const r = EnquirySchema.safeParse(validEnquiry);
    if (!r.success) throw new Error(JSON.stringify(r.error));
    expect(r.data.phone).toBeNull();
    expect(r.data.travelDate).toBeNull();
    expect(r.data.groupSize).toBeNull();
  });
  test('accepts groupSize of 1', () => expect(EnquirySchema.safeParse({ ...validEnquiry, groupSize:'1' }).success).toBe(true));
  test('accepts groupSize of 500', () => expect(EnquirySchema.safeParse({ ...validEnquiry, groupSize:'500' }).success).toBe(true));
  test('accepts tripLengthDays of 1', () => expect(EnquirySchema.safeParse({ ...validEnquiry, tripLengthDays:'1' }).success).toBe(true));
  test('accepts tripLengthDays of 90', () => expect(EnquirySchema.safeParse({ ...validEnquiry, tripLengthDays:'90' }).success).toBe(true));
  test('accepts message of exactly 2000 chars', () => {
    expect(EnquirySchema.safeParse({ ...validEnquiry, message:'a'.repeat(2000) }).success).toBe(true);
  });
});

describe('EnquirySchema — invalid inputs', () => {
  test('rejects missing fullName',           () => expect(EnquirySchema.safeParse({ ...validEnquiry, fullName:undefined }).success).toBe(false));
  test('rejects empty fullName',             () => expect(EnquirySchema.safeParse({ ...validEnquiry, fullName:'' }).success).toBe(false));
  test('rejects fullName of 1 char',         () => expect(EnquirySchema.safeParse({ ...validEnquiry, fullName:'A' }).success).toBe(false));
  test('rejects fullName over 120 chars',    () => expect(EnquirySchema.safeParse({ ...validEnquiry, fullName:'A'.repeat(121) }).success).toBe(false));
  test('rejects missing email',              () => expect(EnquirySchema.safeParse({ ...validEnquiry, email:undefined }).success).toBe(false));
  test('rejects empty email',                () => expect(EnquirySchema.safeParse({ ...validEnquiry, email:'' }).success).toBe(false));
  test('rejects invalid email format',       () => expect(EnquirySchema.safeParse({ ...validEnquiry, email:'not-an-email' }).success).toBe(false));
  test('rejects email without TLD',          () => expect(EnquirySchema.safeParse({ ...validEnquiry, email:'user@domain' }).success).toBe(false));
  test('rejects groupSize of 0',             () => expect(EnquirySchema.safeParse({ ...validEnquiry, groupSize:'0' }).success).toBe(false));
  test('rejects negative groupSize',         () => expect(EnquirySchema.safeParse({ ...validEnquiry, groupSize:'-1' }).success).toBe(false));
  test('rejects groupSize over 500',         () => expect(EnquirySchema.safeParse({ ...validEnquiry, groupSize:'501' }).success).toBe(false));
  test('rejects non-integer groupSize',      () => expect(EnquirySchema.safeParse({ ...validEnquiry, groupSize:'2.5' }).success).toBe(false));
  test('rejects tripLengthDays over 90',     () => expect(EnquirySchema.safeParse({ ...validEnquiry, tripLengthDays:'91' }).success).toBe(false));
  test('rejects tripLengthDays of 0',        () => expect(EnquirySchema.safeParse({ ...validEnquiry, tripLengthDays:'0' }).success).toBe(false));
  test('rejects invalid travelDate string',  () => expect(EnquirySchema.safeParse({ ...validEnquiry, travelDate:'not-a-date' }).success).toBe(false));
  test('rejects message over 2000 chars',    () => expect(EnquirySchema.safeParse({ ...validEnquiry, message:'a'.repeat(2001) }).success).toBe(false));
  test('rejects phone over 30 chars',        () => expect(EnquirySchema.safeParse({ ...validEnquiry, phone:'1'.repeat(31) }).success).toBe(false));
});

// ─── ItineraryGenerateSchema ──────────────────────────────────────────────────

describe('ItineraryGenerateSchema — valid inputs', () => {
  test('accepts full valid input',              () => expect(ItineraryGenerateSchema.safeParse(validItinerary).success).toBe(true));
  test('defaults budget to Mid-range',          () => {
    const { budget, ...rest } = validItinerary;
    const r = ItineraryGenerateSchema.safeParse(rest);
    expect(r.success && r.data.budget).toBe('Mid-range');
  });
  test('defaults pace to Balanced',             () => {
    const { pace, ...rest } = validItinerary;
    const r = ItineraryGenerateSchema.safeParse(rest);
    expect(r.success && r.data.pace).toBe('Balanced');
  });
  test('defaults interests to ["scenic"]',      () => {
    const { interests, ...rest } = validItinerary;
    const r = ItineraryGenerateSchema.safeParse(rest);
    expect(r.success && r.data.interests).toEqual(['scenic']);
  });
  test('accepts days = 1',  () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, days:1 }).success).toBe(true));
  test('accepts days = 14', () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, days:14 }).success).toBe(true));
  test.each(['Budget','Mid-range','Premium','Luxury'])('accepts budget "%s"', b =>
    expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, budget:b }).success).toBe(true));
  test.each(['Relaxed','Balanced','Packed'])('accepts pace "%s"', p =>
    expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, pace:p }).success).toBe(true));
  test('accepts exactly 30 attraction IDs', () => {
    const ids = Array.from({ length:30 }, (_, i) => `clh${String(i).padStart(20,'0')}`);
    expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, attractionIds:ids }).success).toBe(true);
  });
  test('accepts 10 interests', () => {
    const interests = ['scenic','wine','culture','family','adventure','food','luxury','beach','wildlife','city'];
    expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, interests }).success).toBe(true);
  });
});

describe('ItineraryGenerateSchema — invalid inputs', () => {
  test('rejects empty attractionIds',       () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, attractionIds:[] }).success).toBe(false));
  test('rejects 31 attraction IDs',         () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, attractionIds: Array.from({length:31},(_,i)=>`clh${i}abc`) }).success).toBe(false));
  test('rejects days = 0',                  () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, days:0 }).success).toBe(false));
  test('rejects days = 15',                 () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, days:15 }).success).toBe(false));
  test('rejects non-integer days',          () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, days:1.5 }).success).toBe(false));
  test('rejects invalid budget',            () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, budget:'Ultra' }).success).toBe(false));
  test('rejects invalid pace',              () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, pace:'Turbo' }).success).toBe(false));
  test('rejects 11 interests',              () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, interests: Array.from({length:11},(_,i)=>`i${i}`) }).success).toBe(false));
  test('rejects interest over 60 chars',    () => expect(ItineraryGenerateSchema.safeParse({ ...validItinerary, interests:['a'.repeat(61)] }).success).toBe(false));
});

// ─── AIGenerateSchema ─────────────────────────────────────────────────────────

describe('AIGenerateSchema — valid inputs', () => {
  const valid = { days:3, groupType:'Couple', budget:'Mid-range', pace:'Balanced', interests:['scenic','wine'], mustSee:['cape-point'] };
  test('accepts full valid input',         () => expect(AIGenerateSchema.safeParse(valid).success).toBe(true));
  test('accepts without mustSee',          () => { const {mustSee,...r}=valid; expect(AIGenerateSchema.safeParse(r).success).toBe(true); });
  test('accepts days 1–14',                () => {
    for (let d=1; d<=14; d++) expect(AIGenerateSchema.safeParse({...valid,days:d}).success).toBe(true);
  });
  test('accepts 10 interests',             () => {
    const interests = Array.from({length:10},(_,i)=>`int${i}`);
    expect(AIGenerateSchema.safeParse({...valid,interests}).success).toBe(true);
  });
  test('accepts up to 20 mustSee items',   () => {
    const mustSee = Array.from({length:20},(_,i)=>`slug-${i}`);
    expect(AIGenerateSchema.safeParse({...valid,mustSee}).success).toBe(true);
  });
});

describe('AIGenerateSchema — invalid inputs', () => {
  const valid = { days:3, groupType:'Couple', budget:'Mid-range', pace:'Balanced', interests:['scenic'] };
  test('rejects empty interests',   () => expect(AIGenerateSchema.safeParse({...valid,interests:[]}).success).toBe(false));
  test('rejects 11 interests',      () => expect(AIGenerateSchema.safeParse({...valid,interests:Array.from({length:11},(_,i)=>`i${i}`)}).success).toBe(false));
  test('rejects days = 0',          () => expect(AIGenerateSchema.safeParse({...valid,days:0}).success).toBe(false));
  test('rejects days = 15',         () => expect(AIGenerateSchema.safeParse({...valid,days:15}).success).toBe(false));
  test('rejects 21 mustSee items',  () => expect(AIGenerateSchema.safeParse({...valid,mustSee:Array.from({length:21},(_,i)=>`slug-${i}`)}).success).toBe(false));
  test('rejects mustSee item > 100 chars', () => expect(AIGenerateSchema.safeParse({...valid,mustSee:['a'.repeat(101)]}).success).toBe(false));
});
