import { useCallback, useEffect, useState } from 'react';
// Demo mode helper: only used when VITE_MOCK=true.
import { mockApi } from './mock';

// Base URL of the shared backend API (set VITE_API_URL in .env).
const BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
// Turns a stored image path like /uploads/a.jpg into a full URL the browser can load.
export const imgUrl = (p?: string) => (!p ? '' : p.startsWith('http') ? p : BASE.replace(/\/api$/, '') + p);

// Error type that keeps the HTTP status so pages can react to 404, 409 and so on.
export class ApiError extends Error { constructor(public status: number, m: string) { super(m); } }

// Every request goes through here: adds the login token, sends JSON, and turns failures into ApiError.
export async function api<T>(path: string, o: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  if (import.meta.env.VITE_MOCK === 'true') return mockApi<T>(path, o); // demo mode
  // The admin's login token is saved in the browser after sign-in.
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (o.body) headers['Content-Type'] = 'application/json';
  let r: Response;
  try {
    r = await fetch(BASE + path, { method: o.method ?? 'GET', headers, body: o.form ?? (o.body ? JSON.stringify(o.body) : undefined) });
  } catch { throw new ApiError(0, 'Cannot reach the server. Check your connection and API address.'); }
  // Token expired or invalid: clear it and send the admin back to the login page.
  if (r.status === 401 && token) { localStorage.removeItem('token'); location.href = '/login'; }
  // Some responses (like 204) have no body, so fall back to an empty object.
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, d.message ?? 'Request failed');
  // The backend wraps single-key results, e.g. { guesthouses: [...] } or { guesthouse: {...} }.
  for (const k of ['guesthouses', 'guesthouse']) if (d && typeof d === 'object' && k in d && Object.keys(d).length === 1) return d[k] as T;
  return d as T;
}

// Hook that loads data from a path and gives pages data, loading, error and a reload function.
export function useApi<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError>();
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true); setError(undefined);
    // An empty path means 'do not fetch' (used by the add form).
    if (!path) { setLoading(false); return; }
    api<T>(path).then(setData).catch(setError).finally(() => setLoading(false));
  }, [path]);
  useEffect(load, [load]);
  return { data, error, loading, reload: load };
}

/** Loads every active guesthouse (with rating and favourite counts) from the search endpoint, 100 per page. */
export function useGuesthouses() {
  const [data, setData] = useState<Guesthouse[]>();
  const [error, setError] = useState<ApiError>();
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError(undefined);
    try {
      const all: Guesthouse[] = []; let total = 0;
      do {
        const r = await api<{ guesthouses: Guesthouse[]; total: number }>(`${routes.search}?limit=100&page=${Math.floor(all.length / 100) + 1}`);
        all.push(...r.guesthouses); total = r.total;
        if (!r.guesthouses.length) break;
      } while (all.length < total);
      setData(all);
    } catch (e) { setError(e as ApiError); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load };
}

// Shapes of the data returned by the backend (they follow its Mongoose models).
export interface Guesthouse {
  _id: string; name: string; logo?: string; gallery: string[]; description: string; amenities: string[];
  pricePerNight: number; city: string; country: string; location: { latitude: number; longitude: number };
  contact: { phone: string; email: string }; verificationStatus: 'pending' | 'verified' | 'rejected'; isActive: boolean;
  averageRating?: number; ratingsCount?: number; favouritesCount?: number;
}
export interface Review {
  _id: string; guesthouseId: { _id: string; name: string } | string; customerId: { name: string } | string; // objects when the backend populates them
  rating: number; comment?: string; createdAt: string; reported?: boolean; reportReason?: string;
}
export interface Stats {
  totalGuesthouses: number; topCity: { city: string; count: number } | null; topRated: { name: string; rating: number } | null;
  totalCustomers?: number; totalRatings?: number; totalFavourites?: number; mostFavourited?: { name: string; count: number } | null;
  mostReviewed?: { name: string; count: number } | null; avgRating: number; avgPrice: number; verified: number; unverified: number;
}
export interface AdminUser { _id: string; name: string; email: string; createdAt?: string }
export interface Notice { _id: string; message: string; createdAt: string }

/** Every endpoint lives here: change these to match the API team's docs. */
export const routes = {
  login: '/auth/login', dashboard: '/admin/dashboard', guesthouses: '/guesthouses', search: '/guesthouses/search',
  reviews: '/admin/reviews', reported: '/admin/reviews/reported', admins: '/admin/users', notifications: '/admin/notifications',
};
