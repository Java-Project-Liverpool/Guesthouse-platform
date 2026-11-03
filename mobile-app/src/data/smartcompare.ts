import type { Stay } from './stays';

export const COMPARE_PRIORITIES = [
  { id: 'overall', label: 'Best overall' },
  { id: 'cheapest', label: 'Cheapest' },
  { id: 'rating', label: 'Highest rated' },
  { id: 'amenities', label: 'Best amenities' },
  { id: 'location', label: 'Best location' },
] as const;

export type ComparePriority = (typeof COMPARE_PRIORITIES)[number]['id'];

type Component = 'affordability' | 'amenities' | 'rating' | 'location' | 'verification';

const PRIOR_RATING = 3.5;
const PRIOR_WEIGHT = 3;

const WEIGHTS: Record<ComparePriority, Record<Component, number>> = {
  overall: { affordability: 35, amenities: 25, rating: 20, location: 10, verification: 10 },
  cheapest: { affordability: 80, amenities: 5, rating: 10, location: 0, verification: 5 },
  rating: { affordability: 10, amenities: 10, rating: 70, location: 0, verification: 10 },
  amenities: { affordability: 15, amenities: 70, rating: 10, location: 0, verification: 5 },
  location: { affordability: 15, amenities: 10, rating: 10, location: 60, verification: 5 },
};

export type CompareMetrics = {
  stay: Stay;
  nightly: number | null;
  stayTotal: number | null;
  bayesianRating: number | null;
  reviewCount: number;
  amenityCount: number | null;
  uniqueAmenities: string[];
  hasLocation: boolean;
  verified: boolean;
};

export type CompareScore = {
  stayId: string;
  score: number | null;
  components: Partial<Record<Component, number>>;
};

export type CompareVerdict = {
  bestValueId: string | null;
  highestRatedId: string | null;
  bestAmenitiesId: string | null;
  mostAffordableId: string | null;
  bestForPriorityId: string | null;
  ranking: CompareScore[];
  metrics: CompareMetrics[];
  priceGapPerNight: Record<string, number>;
};

export function bayesianRating(average: number, count: number): number {
  return (average * count + PRIOR_RATING * PRIOR_WEIGHT) / (count + PRIOR_WEIGHT);
}

export function buildMetrics(stays: Stay[], nights: number): CompareMetrics[] {
  const amenitySets = stays.map((stay) => new Set(stay.amenities.map((a) => a.trim().toLowerCase())));
  return stays.map((stay, index) => {
    const nightly = typeof stay.price === 'number' && stay.price > 0 ? stay.price : null;
    const reviewCount = stay.ratings ?? 0;
    const hasRatings = reviewCount > 0 && typeof stay.rating === 'number';
    const amenityCount = stay.amenities.length > 0 ? stay.amenities.length : null;
    const others = amenitySets.filter((_, i) => i !== index);
    const uniqueAmenities = amenityCount === null || others.length === 0
      ? []
      : stay.amenities.filter((a) => !others.some((set) => set.has(a.trim().toLowerCase())));
    return {
      stay,
      nightly,
      stayTotal: nightly === null ? null : nightly * nights,
      bayesianRating: hasRatings ? bayesianRating(stay.rating as number, reviewCount) : null,
      reviewCount,
      amenityCount,
      uniqueAmenities,
      hasLocation: typeof stay.latitude === 'number' && typeof stay.longitude === 'number',
      verified: stay.verified,
    };
  });
}

function scoreComponents(metrics: CompareMetrics[]): Map<string, Partial<Record<Component, number>>> {
  const prices = metrics.map((m) => m.nightly).filter((v): v is number => v !== null);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const counts = metrics.map((m) => m.amenityCount).filter((v): v is number => v !== null);
  const maxCount = counts.length ? Math.max(...counts) : 0;

  const result = new Map<string, Partial<Record<Component, number>>>();
  for (const m of metrics) {
    const c: Partial<Record<Component, number>> = {};
    if (m.nightly !== null) {
      c.affordability = maxPrice > minPrice ? (maxPrice - m.nightly) / (maxPrice - minPrice) : 1;
    }
    if (m.amenityCount !== null && maxCount > 0) c.amenities = m.amenityCount / maxCount;
    if (m.bayesianRating !== null) c.rating = m.bayesianRating / 5;
    if (m.hasLocation) c.location = 1;
    c.verification = m.verified ? 1 : 0;
    result.set(m.stay.id, c);
  }
  return result;
}

const PRIMARY: Record<ComparePriority, Component> = {
  overall: 'affordability',
  cheapest: 'affordability',
  rating: 'rating',
  amenities: 'amenities',
  location: 'location',
};

function combine(priority: ComparePriority, components: Partial<Record<Component, number>>): number | null {
  if (components[PRIMARY[priority]] === undefined) return null;
  const weights = WEIGHTS[priority];
  let weightSum = 0;
  let weighted = 0;
  for (const key of Object.keys(weights) as Component[]) {
    const value = components[key];
    if (value === undefined || weights[key] === 0) continue;
    weightSum += weights[key];
    weighted += weights[key] * value;
  }
  return weightSum === 0 ? null : weighted / weightSum;
}

export function rankStays(stays: Stay[], nights: number, priority: ComparePriority): CompareVerdict {
  const metrics = buildMetrics(stays, nights);
  const components = scoreComponents(metrics);

  const rank = (p: ComparePriority): CompareScore[] =>
    stays
      .map((stay) => ({ stayId: stay.id, components: components.get(stay.id) ?? {}, score: combine(p, components.get(stay.id) ?? {}) }))
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || a.stayId.localeCompare(b.stayId));

  const ranking = rank(priority);
  const overall = rank('overall');
  const pick = (ids: (string | null)[]) => ids[0] ?? null;

  const priced = metrics.filter((m) => m.nightly !== null);
  const cheapest = priced.length >= 2 && new Set(priced.map((m) => m.nightly)).size > 1
    ? priced.reduce((a, b) => ((a.nightly as number) <= (b.nightly as number) ? a : b)).stay.id
    : null;

  const rated = metrics.filter((m) => m.bayesianRating !== null);
  const highestRated = rated.length >= 2
    ? rated.reduce((a, b) => (((a.bayesianRating as number) >= (b.bayesianRating as number)) ? a : b)).stay.id
    : null;

  const withAmenities = metrics.filter((m) => m.amenityCount !== null);
  const bestAmenities = withAmenities.length >= 2 && new Set(withAmenities.map((m) => m.amenityCount)).size > 1
    ? withAmenities.reduce((a, b) => ((a.amenityCount as number) >= (b.amenityCount as number) ? a : b)).stay.id
    : null;

  const cheapestPrice = priced.length ? Math.min(...priced.map((m) => m.nightly as number)) : 0;
  const priceGapPerNight: Record<string, number> = {};
  for (const m of priced) priceGapPerNight[m.stay.id] = (m.nightly as number) - cheapestPrice;

  return {
    bestValueId: pick(overall.filter((s) => s.score !== null).map((s) => s.stayId)),
    highestRatedId: highestRated,
    bestAmenitiesId: bestAmenities,
    mostAffordableId: cheapest,
    bestForPriorityId: pick(ranking.filter((s) => s.score !== null).map((s) => s.stayId)),
    ranking,
    metrics,
    priceGapPerNight,
  };
}

export function reasonsFor(stayId: string, verdict: CompareVerdict): string[] {
  const m = verdict.metrics.find((x) => x.stay.id === stayId);
  if (!m) return [];
  const reasons: string[] = [];
  if (verdict.mostAffordableId === stayId) reasons.push('Lowest nightly price in this comparison.');
  else if (m.nightly !== null && verdict.priceGapPerNight[stayId] !== undefined) {
    reasons.push(`P ${verdict.priceGapPerNight[stayId].toLocaleString('en-US')} more per night than the cheapest option.`);
  }
  if (m.bayesianRating !== null) {
    const few = m.reviewCount < 3 ? ' (few reviews, so this is a cautious estimate)' : '';
    reasons.push(`Rated ${(m.stay.rating as number).toFixed(1)}/5 from ${m.reviewCount} review${m.reviewCount === 1 ? '' : 's'}${few}.`);
  } else {
    reasons.push('No reviews yet.');
  }
  if (m.amenityCount !== null) {
    reasons.push(`Lists ${m.amenityCount} amenit${m.amenityCount === 1 ? 'y' : 'ies'}.`);
    if (m.uniqueAmenities.length > 0) reasons.push(`Unique here: ${m.uniqueAmenities.join(', ')}.`);
  } else {
    reasons.push('No amenities listed.');
  }
  reasons.push(m.verified ? 'Verified listing.' : 'Not yet verified.');
  return reasons;
}
