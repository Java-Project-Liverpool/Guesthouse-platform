import { apiRequest } from '@/data/api';
import { toStay, type ApiGuesthouse, type Stay } from '@/data/stays';
import type { PlanResult, TripInput } from '@/data/smarttrip-engine';

const PAGE_SIZE = 100;
const MAX_PAGES = 10;
const CACHE_MS = 5 * 60_000;

type SearchResponse = { guesthouses?: ApiGuesthouse[]; total?: number };

let cachedStays: Stay[] | null = null;
let cachedAt = 0;
let inFlight: Promise<Stay[]> | null = null;

async function fetchAllStays(): Promise<Stay[]> {
  const collected: ApiGuesthouse[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await apiRequest<SearchResponse>(
      `/api/guesthouses/search?sortBy=recent&limit=${PAGE_SIZE}&page=${page}`
    );
    const items = Array.isArray(result.guesthouses) ? result.guesthouses : [];
    collected.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return collected
    .filter((item) => typeof item._id === 'string' && Boolean(item.name))
    .map((item, index) => toStay(item, index));
}

export function loadTripStays(force = false): Promise<Stay[]> {
  if (!force && cachedStays && Date.now() - cachedAt < CACHE_MS) return Promise.resolve(cachedStays);
  if (!force && inFlight) return inFlight;
  const request = fetchAllStays()
    .then((stays) => {
      cachedStays = stays;
      cachedAt = Date.now();
      return stays;
    })
    .finally(() => {
      if (inFlight === request) inFlight = null;
    });
  inFlight = request;
  return request;
}

export function destinationsFrom(stays: Stay[]): string[] {
  const cities = new Set<string>();
  for (const stay of stays) {
    const city = stay.city.trim();
    if (city) cities.add(city);
  }
  return [...cities].sort((a, b) => a.localeCompare(b));
}

export type SavedPlan = { input: TripInput; result: PlanResult };

let lastPlan: SavedPlan | null = null;

export function setLastPlan(plan: SavedPlan) {
  lastPlan = plan;
}

export function getLastPlan(): SavedPlan | null {
  return lastPlan;
}
