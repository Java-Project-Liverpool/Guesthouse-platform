import { useCallback, useEffect, useState } from 'react';

const BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
export const imgUrl = (p?: string) => (!p ? '' : p.startsWith('http') ? p : BASE.replace(/\/api$/, '') + p);

export class ApiError extends Error { constructor(public status: number, m: string) { super(m); } }

export async function api<T>(path: string, o: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (o.body) headers['Content-Type'] = 'application/json';
  let r: Response;
  try {
    r = await fetch(BASE + path, { method: o.method ?? 'GET', headers, body: o.form ?? (o.body ? JSON.stringify(o.body) : undefined) });
  } catch { throw new ApiError(0, 'Cannot reach the server. Check your connection and API address.'); }
  if (r.status === 401 && token) { localStorage.removeItem('token'); location.href = '/login'; }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(r.status, d.message ?? 'Request failed');
  return d as T;
}

export function useApi<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError>();
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true); setError(undefined);
    if (!path) { setLoading(false); return; }
    api<T>(path).then(setData).catch(setError).finally(() => setLoading(false));
  }, [path]);
  useEffect(load, [load]);
  return { data, error, loading, reload: load };
}

export interface Guesthouse {
  _id: string; name: string; logo?: string; gallery: string[]; description: string; amenities: string[];
  pricePerNight: number; city: string; country: string; location: { latitude: number; longitude: number };
  contact: { phone: string; email: string }; verificationStatus: 'pending' | 'verified' | 'rejected'; isActive: boolean;
  avgRating?: number; ratingCount?: number;
}
export interface Review {
  _id: string; guesthouse: { _id: string; name: string } | string; customer: { name: string } | string;
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
  login: '/auth/login', dashboard: '/admin/dashboard', guesthouses: '/guesthouses',
  reviews: '/admin/reviews', reported: '/admin/reviews/reported', admins: '/admin/users', notifications: '/admin/notifications',
};
