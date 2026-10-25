import { useCallback, useEffect, useState } from 'react';

import { apiRequest } from '@/data/api';

export type Stay = {
  id: string;
  name: string;
  city: string;
  country?: string;
  price?: number;
  rating?: number;
  ratings?: number;
  verified: boolean;
  color: string;
  image?: string;
  images: string[];
  description?: string;
  amenities: string[];
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
};

export type GuesthouseReview = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt?: string;
};

export type ApiGuesthouse = {
  _id: string;
  name: string;
  logo?: string;
  gallery?: string[];
  description?: string;
  amenities?: string[];
  pricePerNight?: number;
  city?: string;
  country?: string;
  location?: { latitude?: number; longitude?: number };
  contact?: { phone?: string; email?: string };
  verificationStatus?: string;
  averageRating?: number;
  ratingsCount?: number;
};

type GuesthousesResponse = { guesthouses?: ApiGuesthouse[] };
const colors = ['#526B5C', '#B87B55', '#7B8062', '#9A725C', '#647A78'];
let cachedStays: Stay[] | null = null;
let cachedAt = 0;
let inFlight: Promise<Stay[]> | null = null;

export function toStay(item: ApiGuesthouse, index = 0): Stay {
  const images = [...(item.gallery ?? []), ...(item.logo ? [item.logo] : [])].filter(
    (url, position, all) => typeof url === 'string' && url.length > 0 && all.indexOf(url) === position
  );
  const ratingCount = Number(item.ratingsCount);
  const averageRating = Number(item.averageRating);
  return {
    id: item._id,
    name: item.name,
    city: item.city ?? '',
    country: item.country,
    ...(Number.isFinite(item.pricePerNight) ? { price: item.pricePerNight } : {}),
    ...(ratingCount > 0 && Number.isFinite(averageRating)
      ? { rating: averageRating, ratings: ratingCount }
      : {}),
    verified: item.verificationStatus === 'verified',
    color: colors[index % colors.length],
    image: images[0],
    images,
    description: item.description,
    amenities: Array.isArray(item.amenities) ? item.amenities : [],
    ...(Number.isFinite(item.location?.latitude) ? { latitude: item.location?.latitude } : {}),
    ...(Number.isFinite(item.location?.longitude) ? { longitude: item.location?.longitude } : {}),
    phone: item.contact?.phone,
    email: item.contact?.email,
  };
}

export async function getStay(id: string): Promise<Stay> {
  const result = await apiRequest<{ guesthouse?: ApiGuesthouse }>(`/api/guesthouses/${encodeURIComponent(id)}`);
  if (!result.guesthouse?._id) throw new Error('This guesthouse could not be found.');
  return toStay(result.guesthouse, 0);
}

export async function getStayReviews(id: string): Promise<GuesthouseReview[]> {
  const result = await apiRequest<{ ratings?: Record<string, unknown>[] }>(
    `/api/guesthouses/${encodeURIComponent(id)}/ratings`
  );
  return (result.ratings ?? []).map((item) => {
    const customer = item.customerId;
    const name = customer && typeof customer === 'object' && 'name' in customer ? customer.name : 'Guest';
    return {
      id: String(item._id ?? ''),
      name: typeof name === 'string' ? name : 'Guest',
      rating: Number(item.rating),
      comment: typeof item.comment === 'string' ? item.comment : '',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
    };
  });
}

export async function submitStayReview(id: string, token: string, rating: number, comment: string) {
  return apiRequest(`/api/guesthouses/${encodeURIComponent(id)}/ratings`, {
    method: 'POST', token, body: { rating, comment },
  });
}

function loadStays(force: boolean): Promise<Stay[]> {
  if (!force && cachedStays && Date.now() - cachedAt < 60_000) return Promise.resolve(cachedStays);
  if (!force && inFlight) return inFlight;
  const request = apiRequest<GuesthousesResponse>('/api/guesthouses/search?sortBy=recent&limit=100')
    .then((result) => {
      const items = Array.isArray(result.guesthouses) ? result.guesthouses : [];
      cachedStays = items.filter((item) => typeof item._id === 'string' && Boolean(item.name)).map(toStay);
      cachedAt = Date.now();
      return cachedStays;
    })
    .finally(() => { if (inFlight === request) inFlight = null; });
  inFlight = request;
  return request;
}

export function useStays() {
  const [stays, setStays] = useState<Stay[]>(cachedStays ?? []);
  const [loading, setLoading] = useState(!cachedStays);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;
    if (cachedStays && attempt === 0 && Date.now() - cachedAt < 60_000) {
      return () => { active = false; };
    }
    {
      loadStays(attempt > 0)
      .then((items) => {
        if (!active) return;
        setStays(items);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load guesthouses.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    }
    return () => { active = false; };
  }, [attempt]);

  return { stays, loading, error, retry };
}
