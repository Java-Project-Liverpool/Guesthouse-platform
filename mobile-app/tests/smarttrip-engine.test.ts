import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  ESTIMATE_DEFAULTS,
  buildItinerary,
  nightsBetween,
  planTrip,
  validateTrip,
  type TripInput,
} from '../src/data/smarttrip-engine.ts';
import type { Stay } from '../src/data/stays.ts';

function stay(overrides: Partial<Stay> & { id: string; name: string }): Stay {
  return {
    city: 'Maun',
    images: [],
    amenities: [],
    verified: false,
    color: '#000000',
    ...overrides,
  };
}

const fixtures: Stay[] = [
  stay({ id: 'a', name: 'River Camp', price: 800, rating: 4.5, ratings: 4, amenities: ['Wi-Fi', 'Pool'], latitude: -19.98, longitude: 23.42 }),
  stay({ id: 'b', name: 'Delta Lodge', price: 1200, amenities: ['Wi-Fi', 'Breakfast', 'Pool'], latitude: -19.9, longitude: 23.5 }),
  stay({ id: 'c', name: 'Budget Inn', price: 500, amenities: ['Parking'] }),
  stay({ id: 'd', name: 'Gaborone Hotel', city: 'Gaborone', price: 300, amenities: ['Wi-Fi'] }),
  stay({ id: 'e', name: 'Unpriced Guest', city: 'Maun' }),
];

function trip(overrides: Partial<TripInput> = {}): TripInput {
  return {
    destination: 'Maun',
    adults: 2,
    children: 0,
    arrival: '2026-12-01',
    departure: '2026-12-03',
    rooms: 1,
    budget: 4500,
    transport: 'personal',
    transportEstimate: 900,
    foodPerPersonPerDay: ESTIMATE_DEFAULTS.foodPerPersonPerDay,
    activityPerPersonPerDay: ESTIMATE_DEFAULTS.activityPerPersonPerDay,
    otherEstimate: 200,
    interests: ['nature', 'sightseeing'],
    tier: 'any',
    requiredAmenities: [],
    optionalAmenities: [],
    ...overrides,
  };
}

test('nightsBetween counts nights and rejects invalid ranges', () => {
  assert.equal(nightsBetween('2026-12-01', '2026-12-04'), 3);
  assert.equal(nightsBetween('2026-12-04', '2026-12-01'), null);
  assert.equal(nightsBetween('2026-12-01', '2026-12-01'), null);
  assert.equal(nightsBetween('01/12/2026', '2026-12-04'), null);
  assert.equal(nightsBetween('2026-02-30', '2026-03-02'), null);
});

test('validateTrip reports every invalid field', () => {
  const errors = validateTrip(trip({ destination: ' ', adults: 0, budget: 0, departure: '2026-11-30', transportEstimate: -1 }));
  assert.ok(errors.some((e) => e.includes('destination')));
  assert.ok(errors.some((e) => e.includes('adult')));
  assert.ok(errors.some((e) => e.includes('budget')));
  assert.ok(errors.some((e) => e.includes('dates')));
  assert.ok(errors.some((e) => e.includes('Transport')));
});

test('planTrip refuses invalid input instead of guessing', () => {
  const result = planTrip(fixtures, trip({ budget: -10 }));
  assert.equal(result.status, 'invalid');
});

test('no listings in the destination is reported, not faked', () => {
  const result = planTrip(fixtures, trip({ destination: 'Francistown' }));
  assert.deepEqual(result, { status: 'no-destination', destination: 'Francistown' });
});

test('stays without a price are excluded and counted', () => {
  const result = planTrip(fixtures, trip());
  assert.equal(result.status, 'ok');
  if (result.status !== 'ok') return;
  assert.equal(result.excludedUnpriced, 1);
  assert.ok(result.candidates.every((c) => c.stay.id !== 'e'));
});

test('accommodation is nightly price x nights x rooms and the breakdown balances', () => {
  const result = planTrip(fixtures, trip({ rooms: 2 }));
  assert.equal(result.status, 'ok');
  if (result.status !== 'ok') return;
  for (const c of result.candidates) {
    assert.equal(c.accommodationCost, (c.stay.price as number) * 2 * 2);
    const b = c.breakdown;
    assert.equal(b.remaining, 4500 - (b.accommodation + b.transport + b.food + b.activities + b.other));
  }
  assert.equal(result.days, 3);
});

test('food and activity estimates scale with travellers and days', () => {
  const result = planTrip(fixtures, trip({ adults: 2, children: 1 }));
  if (result.status !== 'ok') assert.fail(result.status);
  assert.equal(result.candidates[0].breakdown.food, ESTIMATE_DEFAULTS.foodPerPersonPerDay * 3 * 3);
  assert.equal(result.candidates[0].breakdown.activities, ESTIMATE_DEFAULTS.activityPerPersonPerDay * 3 * 3);
});

test('budget too low returns the minimum budget needed', () => {
  const result = planTrip(fixtures, trip({ budget: 1000 }));
  assert.equal(result.status, 'budget-too-low');
  if (result.status !== 'budget-too-low') return;
  assert.equal(result.cheapest, 'Budget Inn');
  assert.ok(result.minimumBudget > 1000);
  assert.equal(result.shortfall, result.minimumBudget - 1000);
});

test('required amenities are mandatory filters', () => {
  const result = planTrip(fixtures, trip({ requiredAmenities: ['Breakfast'], budget: 6000 }));
  assert.equal(result.status, 'ok');
  if (result.status !== 'ok') return;
  assert.deepEqual(result.candidates.map((c) => c.stay.id), ['b']);
  const none = planTrip(fixtures, trip({ requiredAmenities: ['Bar'] }));
  assert.deepEqual(none, { status: 'no-required-amenities', required: ['Bar'] });
});

test('scoring is deterministic and missing data does not penalise a stay', () => {
  const a = planTrip(fixtures, trip());
  const b = planTrip(fixtures, trip());
  assert.deepEqual(a, b);
  if (a.status !== 'ok') assert.fail(a.status);
  const unrated = a.candidates.find((c) => c.stay.id === 'c');
  assert.ok(unrated);
  assert.equal(unrated.categories.rating, undefined);
  assert.ok(unrated.reasons.includes('No reviews yet.'));
});

test('match score is a 0-1 weighted average of the categories present', () => {
  const result = planTrip(fixtures, trip({ optionalAmenities: ['Pool'], tier: 'comfortable' }));
  if (result.status !== 'ok') assert.fail(result.status);
  for (const c of result.candidates) {
    assert.ok(c.score >= 0 && c.score <= 1);
    assert.ok(c.categories.budget !== undefined);
    assert.ok(c.categories.amenities !== undefined);
  }
});

test('recommendation labels are only given when the data supports them', () => {
  const result = planTrip(fixtures, trip());
  if (result.status !== 'ok') assert.fail(result.status);
  assert.ok(result.candidates[0].labels.includes('Best Overall Match'));
  assert.ok(result.candidates.every((c) => !c.labels.includes('Best Amenities')));

  const amenityResult = planTrip(fixtures, trip({ optionalAmenities: ['Pool', 'Breakfast'] }));
  if (amenityResult.status !== 'ok') assert.fail(amenityResult.status);
  const withAmenities = amenityResult.candidates.filter((c) => c.labels.includes('Best Amenities'));
  assert.ok(withAmenities.length <= 1);
});

test('itinerary has one entry per day and starts and ends correctly', () => {
  const days = buildItinerary('River Camp', 'Maun', 2, ['nature']);
  assert.equal(days.length, 3);
  assert.equal(days[0].title, 'Arrival');
  assert.equal(days[2].title, 'Departure');
  assert.ok(days[0].items[0].text.includes('River Camp'));
  assert.ok(days[1].items.some((item) => item.text.includes('Maun')));
});

test('itinerary without interests falls back to generic activities', () => {
  const days = buildItinerary('River Camp', 'Maun', 1, []);
  assert.equal(days.length, 2);
  assert.ok(days[0].items.some((item) => item.text === 'Explore Maun'));
});
