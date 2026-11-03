import { test } from 'node:test';
import assert from 'node:assert/strict';

import { bayesianRating, rankStays, reasonsFor } from '../src/data/smartcompare.ts';
import type { Stay } from '../src/data/stays.ts';

function stay(overrides: Partial<Stay> & { id: string; name: string }): Stay {
  return { city: 'Maun', images: [], amenities: [], verified: false, color: '#000000', ...overrides };
}

const cheap = stay({ id: 'cheap', name: 'Budget Camp', price: 500, rating: 3.8, ratings: 2, amenities: ['Wi-Fi'], verified: false });
const pricey = stay({ id: 'pricey', name: 'Delta Lodge', price: 1500, rating: 4.7, ratings: 40, amenities: ['Wi-Fi', 'Pool', 'Breakfast', 'Bar'], verified: true, latitude: -19.9, longitude: 23.5 });
const middle = stay({ id: 'middle', name: 'River House', price: 900, amenities: ['Wi-Fi', 'Parking'], verified: true });

test('a single five-star review does not outrank many solid reviews', () => {
  assert.ok(bayesianRating(5, 1) < bayesianRating(4.7, 40));
  assert.equal(bayesianRating(4, 0) > 0, true);
});

test('changing the priority changes the ranking', () => {
  const cheapest = rankStays([cheap, pricey, middle], 2, 'cheapest');
  assert.equal(cheapest.ranking[0].stayId, 'cheap');
  const rated = rankStays([cheap, pricey, middle], 2, 'rating');
  assert.equal(rated.ranking[0].stayId, 'pricey');
  const amenities = rankStays([cheap, pricey, middle], 2, 'amenities');
  assert.equal(amenities.ranking[0].stayId, 'pricey');
});

test('labels identify the true leaders without inventing winners', () => {
  const verdict = rankStays([cheap, pricey, middle], 2, 'overall');
  assert.equal(verdict.mostAffordableId, 'cheap');
  assert.equal(verdict.highestRatedId, 'pricey');
  assert.equal(verdict.bestAmenitiesId, 'pricey');
  assert.equal(verdict.bestForPriorityId, verdict.ranking[0].stayId);
});

test('missing ratings and amenities are not penalised', () => {
  const plain = stay({ id: 'plain', name: 'Plain Stay', price: 700 });
  const verdict = rankStays([plain, middle], 2, 'overall');
  const row = verdict.ranking.find((r) => r.stayId === 'plain');
  assert.ok(row && row.score !== null);
  assert.equal(row.components.rating, undefined);
  assert.equal(row.components.amenities, undefined);
  assert.equal(verdict.highestRatedId, null);
  assert.equal(verdict.bestAmenitiesId, null);
});

test('no priced stays yields no cheapest label and no score', () => {
  const unpriced = [stay({ id: 'a', name: 'A' }), stay({ id: 'b', name: 'B' })];
  const verdict = rankStays(unpriced, 2, 'cheapest');
  assert.equal(verdict.mostAffordableId, null);
  assert.ok(verdict.ranking.every((r) => r.score === null));
  assert.equal(verdict.bestForPriorityId, null);
});

test('stay totals multiply nightly price by nights', () => {
  const verdict = rankStays([cheap, pricey], 3, 'overall');
  const metric = verdict.metrics.find((m) => m.stay.id === 'pricey');
  assert.equal(metric?.stayTotal, 4500);
});

test('unique amenities are only listed when another stay lacks them', () => {
  const verdict = rankStays([cheap, pricey], 2, 'overall');
  const metric = verdict.metrics.find((m) => m.stay.id === 'pricey');
  assert.deepEqual(metric?.uniqueAmenities, ['Pool', 'Breakfast', 'Bar']);
});

test('reasons are generated from real data only', () => {
  const verdict = rankStays([cheap, pricey], 2, 'overall');
  const reasons = reasonsFor('cheap', verdict);
  assert.ok(reasons.includes('Lowest nightly price in this comparison.'));
  assert.ok(reasons.some((r) => r.includes('few reviews')));
  const priceyReasons = reasonsFor('pricey', verdict);
  assert.ok(priceyReasons.some((r) => r.includes('1,000 more per night') || r.includes('1000 more per night')));
});
