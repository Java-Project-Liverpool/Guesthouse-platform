import type { Stay } from './stays';
import type { TripInput } from './smarttrip-engine';
import { nightsBetween } from './smarttrip-engine';

export type Alternative = {
  label: string;
  explanation: string;
  input: Partial<TripInput>;
  candidates: { stay: Stay; nightly: number; accommodationCost: number }[];
  scoreCloseness: number; // 0 = closest to original, 1 = furthest
};

function norm(text: string) {
  return text.trim().toLowerCase();
}

function hasAmenity(stay: Stay, amenity: string) {
  return stay.amenities.some((item) => norm(item) === norm(amenity));
}

export function suggestAlternatives(stays: Stay[], input: TripInput, nights: number): Alternative[] {
  const cityStays = stays.filter((stay) => norm(stay.city) === norm(input.destination));
  if (cityStays.length === 0) return [];

  const priced = cityStays.filter((stay) => typeof stay.price === 'number' && stay.price > 0);
  if (priced.length === 0) return [{ label: 'Add a budget', explanation: 'No priced stays exist in this destination yet.', input: {}, candidates: [], scoreCloseness: 1 }];

  const alternatives: Alternative[] = [];

  // Helper: compute affordable candidates for a modified input
  function compute(modified: Partial<TripInput>) {
    const required = (modified.requiredAmenities ?? input.requiredAmenities) as string[];
    const budget = Number.isFinite(modified.budget as number) ? (modified.budget as number) : input.budget;
    const nightsValue = nightsBetween(modified.arrival ?? input.arrival, modified.departure ?? input.departure) ?? nights;
    const eligible = priced.filter((stay) => required.every((a) => stay.amenities.some((item) => norm(item) === norm(a))));
    const costed = eligible.map((stay) => {
      const nightly = stay.price as number;
      const rooms = (modified.rooms ?? input.rooms) || 1;
      const accommodationCost = nightly * nightsValue * rooms;
      return { stay, nightly, accommodationCost };
    });
    const affordable = costed.filter((c) => {
      if (budget <= 0) return false;
      // quick budget suitability: nightly should not exceed budget per night too wildly
      return c.accommodationCost <= budget * 1.3;
    });
    return affordable.sort((a, b) => a.accommodationCost - b.accommodationCost || a.stay.name.localeCompare(b.stay.name)).slice(0, 5);
  }

  // 1. Increase budget by 20%
  const higherBudget = compute({ budget: Math.round(input.budget * 1.2) });
  if (higherBudget.length > 0) {
    alternatives.push({
      label: `Increase budget to P ${Math.round(input.budget * 1.2).toLocaleString('en-US')}`,
      explanation: `Your current budget excludes some stays. Raising it by 20% unlocks ${higherBudget.length} option${higherBudget.length === 1 ? '' : 's'}.`,
      input: { budget: Math.round(input.budget * 1.2) },
      candidates: higherBudget,
      scoreCloseness: 0.15,
    });
  }

  // 2. Drop the most restrictive optional amenity
  if (input.optionalAmenities.length > 0) {
    const withoutOptional = input.optionalAmenities.slice(0, -1);
    if (withoutOptional.length < input.optionalAmenities.length) {
      const result = compute({ optionalAmenities: withoutOptional });
      if (result.length > 0) {
        alternatives.push({
          label: `Drop optional: ${input.optionalAmenities[input.optionalAmenities.length - 1]}`,
          explanation: `Removing one optional preference (${input.optionalAmenities[input.optionalAmenities.length - 1]}) unlocks ${result.length} option${result.length === 1 ? '' : 's'}.`,
          input: { optionalAmenities: withoutOptional },
          candidates: result,
          scoreCloseness: 0.3,
        });
      }
    }
  }

  // 3. Relax tier to 'any'
  if (input.tier !== 'any') {
    const result = compute({ tier: 'any' });
    if (result.length > 0) {
      alternatives.push({
        label: 'Relax accommodation style to Any',
        explanation: 'Removing the style preference gives more flexibility and unlocks matches.',
        input: { tier: 'any' },
        candidates: result,
        scoreCloseness: 0.35,
      });
    }
  }

  // 4. If must-have amenities are blocking, suggest removing one required (only if user explicitly chooses later)
  if (input.requiredAmenities.length > 0) {
    // We include this as a last-resort option but label it clearly as requiring user choice
    const withoutOne = input.requiredAmenities.slice(1);
    const result = compute({ requiredAmenities: withoutOne });
    if (result.length > 0) {
      alternatives.push({
        label: `Relax must-have: remove ${input.requiredAmenities[0]}`,
        explanation: `If you can do without ${input.requiredAmenities[0]}, ${result.length} additional stay${result.length === 1 ? '' : 's'} become available.`,
        input: { requiredAmenities: withoutOne },
        candidates: result,
        scoreCloseness: 0.7,
      });
    }
  }

  // 5. Small budget bump combined with dropping one optional (compound alternative)
  const compound = compute({ budget: Math.round(input.budget * 1.1), optionalAmenities: input.optionalAmenities.slice(0, -1) });
  if (compound.length > 0 && compound.length !== higherBudget.length) {
    alternatives.push({
      label: `Small budget bump + drop ${input.optionalAmenities[input.optionalAmenities.length - 1] || 'optional preference'}`,
      explanation: `A 10% budget increase plus dropping one optional preference unlocks ${compound.length} option${compound.length === 1 ? '' : 's'}.`,
      input: { budget: Math.round(input.budget * 1.1), optionalAmenities: input.optionalAmenities.slice(0, -1) },
      candidates: compound,
      scoreCloseness: 0.45,
    });
  }

  // Sort by closeness (closest first) then by number of unlocked candidates
  alternatives.sort((a, b) => a.scoreCloseness - b.scoreCloseness || b.candidates.length - a.candidates.length);

  // Deduplicate by label
  const seen = new Set<string>();
  const unique: Alternative[] = [];
  for (const alt of alternatives) {
    if (!seen.has(alt.label)) {
      seen.add(alt.label);
      unique.push(alt);
    }
  }

  return unique.slice(0, 4);
}
