import type { Stay } from './stays';

export const TRANSPORT_OPTIONS = [
  { id: 'personal', label: 'Personal vehicle', defaultEstimate: 900 },
  { id: 'public', label: 'Public transport', defaultEstimate: 450 },
  { id: 'rental', label: 'Rental vehicle', defaultEstimate: 1200 },
  { id: 'other', label: 'Other', defaultEstimate: 300 },
] as const;

export const INTEREST_OPTIONS = [
  { id: 'nature', label: 'Nature' },
  { id: 'wildlife', label: 'Wildlife' },
  { id: 'sightseeing', label: 'Sightseeing' },
  { id: 'food', label: 'Restaurants & food' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'relaxation', label: 'Relaxation' },
  { id: 'cultural', label: 'Cultural experiences' },
  { id: 'shopping', label: 'Shopping' },
] as const;

export const TIER_OPTIONS = [
  { id: 'budget', label: 'Budget-friendly' },
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'premium', label: 'Premium' },
  { id: 'any', label: 'Any' },
] as const;

export const AMENITY_OPTIONS = [
  'Wi-Fi', 'Pool', 'Breakfast', 'Parking', 'Air Conditioning', 'Restaurant', 'Bar', 'Airport Shuttle',
] as const;

export const ESTIMATE_DEFAULTS = {
  foodPerPersonPerDay: 120,
  activityPerPersonPerDay: 60,
  otherEstimate: 200,
} as const;

export const SCORE_WEIGHTS = {
  budget: 35,
  destination: 20,
  preferences: 20,
  amenities: 15,
  rating: 10,
} as const;

export type Transport = (typeof TRANSPORT_OPTIONS)[number]['id'];
export type Interest = (typeof INTEREST_OPTIONS)[number]['id'];
export type StayTier = (typeof TIER_OPTIONS)[number]['id'];
export type ScoreCategory = keyof typeof SCORE_WEIGHTS;

export type TripInput = {
  destination: string;
  adults: number;
  children: number;
  arrival: string;
  departure: string;
  rooms: number;
  budget: number;
  transport: Transport;
  transportEstimate: number;
  foodPerPersonPerDay: number;
  activityPerPersonPerDay: number;
  otherEstimate: number;
  interests: Interest[];
  tier: StayTier;
  requiredAmenities: string[];
  optionalAmenities: string[];
};

export type Breakdown = {
  accommodation: number;
  transport: number;
  food: number;
  activities: number;
  other: number;
  remaining: number;
};

export type RecommendationLabel = 'Best Overall Match' | 'Best Value' | 'Best Amenities';

export type Candidate = {
  stay: Stay;
  nightly: number;
  accommodationCost: number;
  breakdown: Breakdown;
  score: number;
  categories: Partial<Record<ScoreCategory, number>>;
  matchedOptional: string[];
  missingOptional: string[];
  reasons: string[];
  labels: RecommendationLabel[];
};

export type PlanResult =
  | { status: 'invalid'; errors: string[] }
  | { status: 'no-destination'; destination: string }
  | { status: 'no-priced-stays'; destination: string }
  | { status: 'no-required-amenities'; required: string[] }
  | { status: 'budget-too-low'; minimumBudget: number; shortfall: number; cheapest: string }
  | {
      status: 'ok';
      days: number;
      candidates: Candidate[];
      excludedUnpriced: number;
      excludedBudget: number;
      destinationCount: number;
    };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function nightsBetween(arrival: string, departure: string): number | null {
  if (!DATE_PATTERN.test(arrival) || !DATE_PATTERN.test(departure)) return null;
  const a = Date.parse(`${arrival}T00:00:00Z`);
  const d = Date.parse(`${departure}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(d)) return null;
  if (new Date(a).toISOString().slice(0, 10) !== arrival) return null;
  if (new Date(d).toISOString().slice(0, 10) !== departure) return null;
  const nights = Math.round((d - a) / 86_400_000);
  return nights >= 1 ? nights : null;
}

export function validateTrip(input: TripInput): string[] {
  const errors: string[] = [];
  if (!input.destination.trim()) errors.push('Choose a destination.');
  if (!Number.isInteger(input.adults) || input.adults < 1) errors.push('At least one adult is required.');
  if (!Number.isInteger(input.children) || input.children < 0) errors.push('Children must be zero or more.');
  if (!Number.isInteger(input.rooms) || input.rooms < 1) errors.push('At least one room is required.');
  const nights = nightsBetween(input.arrival, input.departure);
  if (nights === null) errors.push('Enter valid dates (YYYY-MM-DD) with departure after arrival.');
  else if (nights > 30) errors.push('SmartTrip plans trips of up to 30 nights.');
  if (!Number.isFinite(input.budget) || input.budget <= 0) errors.push('Enter a total budget greater than P0.');
  for (const [label, value] of [
    ['Transport', input.transportEstimate],
    ['Food', input.foodPerPersonPerDay],
    ['Activities', input.activityPerPersonPerDay],
    ['Other', input.otherEstimate],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) errors.push(`${label} estimate cannot be negative.`);
  }
  return errors;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function norm(value: string) {
  return value.trim().toLowerCase();
}

function hasAmenity(stay: Stay, amenity: string) {
  return stay.amenities.some((item) => norm(item) === norm(amenity));
}

function tierScore(tier: StayTier, share: number) {
  if (tier === 'budget') return share <= 0.5 ? 1 : clamp01(1 - (share - 0.5) * 2);
  if (tier === 'comfortable') {
    if (share < 0.5) return clamp01(share / 0.5);
    if (share <= 0.85) return 1;
    return clamp01(1 - (share - 0.85) * 2.5);
  }
  return clamp01(share / 0.85);
}

export function computeBreakdown(input: TripInput, accommodation: number): Breakdown {
  const days = nightsBetween(input.arrival, input.departure) ?? 0;
  const travellers = input.adults + input.children;
  const transport = input.transportEstimate;
  const food = input.foodPerPersonPerDay * travellers * (days + 1);
  const activities = input.activityPerPersonPerDay * travellers * (days + 1);
  const other = input.otherEstimate;
  return {
    accommodation,
    transport,
    food,
    activities,
    other,
    remaining: input.budget - (accommodation + transport + food + activities + other),
  };
}

export function planTrip(stays: Stay[], input: TripInput): PlanResult {
  const errors = validateTrip(input);
  if (errors.length > 0) return { status: 'invalid', errors };

  const nights = nightsBetween(input.arrival, input.departure) as number;
  const wanted = norm(input.destination);
  const cityStays = stays.filter((stay) => norm(stay.city) === wanted);
  if (cityStays.length === 0) return { status: 'no-destination', destination: input.destination };

  const priced = cityStays.filter((stay) => typeof stay.price === 'number' && stay.price > 0);
  const excludedUnpriced = cityStays.length - priced.length;
  if (priced.length === 0) return { status: 'no-priced-stays', destination: input.destination };

  const required = input.requiredAmenities;
  const eligible = priced.filter((stay) => required.every((amenity) => hasAmenity(stay, amenity)));
  if (eligible.length === 0) return { status: 'no-required-amenities', required };

  const perNightBudget = input.budget / nights;
  const costed = eligible.map((stay) => {
    const nightly = stay.price as number;
    const accommodationCost = nightly * nights * input.rooms;
    return { stay, nightly, accommodationCost, breakdown: computeBreakdown(input, accommodationCost) };
  });

  const affordable = costed.filter((item) => item.breakdown.remaining >= 0);
  const excludedBudget = costed.length - affordable.length;
  if (affordable.length === 0) {
    const cheapest = costed.reduce((best, item) =>
      item.breakdown.accommodation + item.breakdown.transport + item.breakdown.food + item.breakdown.activities + item.breakdown.other
      < best.breakdown.accommodation + best.breakdown.transport + best.breakdown.food + best.breakdown.activities + best.breakdown.other
        ? item : best);
    const minimumBudget = Math.ceil(input.budget - cheapest.breakdown.remaining);
    return {
      status: 'budget-too-low',
      minimumBudget,
      shortfall: minimumBudget - input.budget,
      cheapest: cheapest.stay.name,
    };
  }

  const scored: Candidate[] = affordable.map(({ stay, nightly, accommodationCost, breakdown }) => {
    const categories: Partial<Record<ScoreCategory, number>> = {};
    const reasons: string[] = [];

    categories.budget = clamp01(1 - accommodationCost / input.budget);
    reasons.push(`Accommodation uses ${Math.round((accommodationCost / input.budget) * 100)}% of your budget.`);

    if (typeof stay.latitude === 'number' && typeof stay.longitude === 'number') categories.destination = 1;

    if (input.tier !== 'any') {
      const share = nightly / perNightBudget;
      categories.preferences = tierScore(input.tier, share);
      const label = TIER_OPTIONS.find((tier) => tier.id === input.tier)?.label ?? input.tier;
      reasons.push(categories.preferences >= 0.8 ? `Fits your ${label.toLowerCase()} preference.` : `Only partly matches your ${label.toLowerCase()} preference.`);
    }

    const matchedOptional = input.optionalAmenities.filter((amenity) => hasAmenity(stay, amenity));
    const missingOptional = input.optionalAmenities.filter((amenity) => !hasAmenity(stay, amenity));
    if (input.optionalAmenities.length > 0) {
      categories.amenities = matchedOptional.length / input.optionalAmenities.length;
      reasons.push(matchedOptional.length > 0
        ? `Includes ${matchedOptional.join(', ')}.`
        : 'None of your optional amenities are listed.');
    }

    if (stay.ratings && stay.ratings > 0 && typeof stay.rating === 'number') {
      categories.rating = clamp01(stay.rating / 5);
      reasons.push(`Rated ${stay.rating.toFixed(1)}/5 from ${stay.ratings} review${stay.ratings === 1 ? '' : 's'}.`);
    } else {
      reasons.push('No reviews yet.');
    }

    if (required.length > 0) reasons.push(`Has all required amenities: ${required.join(', ')}.`);
    if (stay.verified) reasons.push('Verified listing.');

    let weightSum = 0;
    let weighted = 0;
    for (const key of Object.keys(categories) as ScoreCategory[]) {
      const value = categories[key];
      if (value === undefined) continue;
      weightSum += SCORE_WEIGHTS[key];
      weighted += SCORE_WEIGHTS[key] * value;
    }

    return {
      stay,
      nightly,
      accommodationCost,
      breakdown,
      score: weightSum === 0 ? 0 : weighted / weightSum,
      categories,
      matchedOptional,
      missingOptional,
      reasons,
      labels: [],
    };
  });

  scored.sort((a, b) =>
    b.score - a.score || a.accommodationCost - b.accommodationCost || a.stay.name.localeCompare(b.stay.name));

  const top = scored.slice(0, 3);
  const best = top[0];
  best.labels.push('Best Overall Match');

  const close = top.filter((item) => item.score >= best.score - 0.1);
  if (close.length >= 2) {
    const value = close.reduce((lowest, item) => (item.accommodationCost < lowest.accommodationCost ? item : lowest));
    value.labels.push('Best Value');
  }

  if (input.optionalAmenities.length > 0 && top.length >= 2) {
    const counts = top.map((item) => item.matchedOptional.length);
    if (Math.max(...counts) > Math.min(...counts)) {
      const winner = top.reduce((most, item) => (item.matchedOptional.length > most.matchedOptional.length ? item : most));
      winner.labels.push('Best Amenities');
    }
  }

  return {
    status: 'ok',
    days: nights + 1,
    candidates: top,
    excludedUnpriced,
    excludedBudget,
    destinationCount: cityStays.length,
  };
}

export type ItineraryItem = { slot: string; text: string };
export type ItineraryDay = { day: number; title: string; items: ItineraryItem[] };

const INTEREST_ACTIVITY: Record<Interest, (city: string) => string> = {
  nature: (city) => `Nature walk or scenic drive around ${city}`,
  wildlife: (city) => `Wildlife viewing trip from ${city} (use a licensed guide)`,
  sightseeing: (city) => `Sightseeing around ${city}`,
  food: (city) => `Try a local restaurant in ${city}`,
  adventure: (city) => `Adventure activity near ${city} (ask your host for options)`,
  relaxation: () => 'Slow afternoon at the guesthouse',
  cultural: (city) => `Visit a cultural site or local market in ${city}`,
  shopping: (city) => `Browse local craft shops in ${city}`,
};

export function buildItinerary(stayName: string, city: string, nights: number, interests: Interest[]): ItineraryDay[] {
  const pick = (index: number, fallback: string) =>
    interests.length > 0 ? INTEREST_ACTIVITY[interests[index % interests.length]](city) : fallback;
  const days: ItineraryDay[] = [];
  const total = nights + 1;
  for (let i = 0; i < total; i += 1) {
    if (i === 0) {
      days.push({
        day: 1,
        title: 'Arrival',
        items: [
          { slot: 'Arrival', text: `Arrive in ${city} and check in at ${stayName}` },
          { slot: 'Afternoon', text: pick(0, `Explore ${city}`) },
          { slot: 'Evening', text: 'Dinner (at the guesthouse or a local restaurant)' },
        ],
      });
    } else if (i === total - 1) {
      days.push({
        day: i + 1,
        title: 'Departure',
        items: [
          { slot: 'Breakfast', text: `Breakfast at ${stayName}` },
          { slot: 'Morning', text: pick(i, `Last activity in ${city}`) },
          { slot: 'Checkout', text: 'Check out and travel onwards' },
        ],
      });
    } else {
      days.push({
        day: i + 1,
        title: 'Explore',
        items: [
          { slot: 'Morning', text: pick(i * 2, `Explore ${city}`) },
          { slot: 'Lunch', text: 'Lunch (local restaurant or packed)' },
          { slot: 'Afternoon', text: pick(i * 2 + 1, `Free time in ${city}`) },
          { slot: 'Evening', text: `Return to ${stayName} for dinner` },
        ],
      });
    }
  }
  return days;
}
