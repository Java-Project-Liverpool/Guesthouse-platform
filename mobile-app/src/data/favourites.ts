import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { ApiError, apiRequest } from '@/data/api';
import { logout, useAuth } from '@/data/auth';
import { toStay, type ApiGuesthouse, type Stay } from '@/data/stays';

let saved: string[] = [];
const listeners = new Set<() => void>();
let favouriteStays: Stay[] = [];
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function update(next: string[]) {
  saved = next;
  listeners.forEach((listener) => listener());
}

export function useFavourites() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const ids = useSyncSaved();
  const isCustomer = Boolean(token && user?.role === 'customer');

  useEffect(() => {
    let active = true;
    if (!isCustomer) {
      update([]);
      favouriteStays = [];
      void Promise.resolve().then(() => {
        if (active) { setError(null); setLoading(false); }
      });
      return () => { active = false; };
    }
    Promise.resolve().then(() => {
      if (active) setLoading(true);
      return apiRequest<{ favourites?: { guesthouseId?: string | ApiGuesthouse }[] }>('/api/favourites', { token: token! });
    })
      .then(({ favourites = [] }) => {
        if (active) {
          favouriteStays = favourites.flatMap(({ guesthouseId }, index) =>
            guesthouseId && typeof guesthouseId === 'object' && guesthouseId._id
              ? [toStay(guesthouseId, index)] : []
          );
          update(favourites.flatMap(({ guesthouseId }) => {
            const id = typeof guesthouseId === 'string' ? guesthouseId : guesthouseId?._id;
            return id ? [id] : [];
          }));
          setError(null);
        }
      })
      .catch(async (reason: unknown) => {
        if (!active) return;
        if (reason instanceof ApiError && reason.status === 401) await logout();
        setError(reason instanceof Error ? reason.message : 'Could not load your favourites.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, isCustomer, attempt]);

  const toggleSaved = useCallback(async (id: string, listing?: Stay) => {
    if (!token) throw new ApiError('Sign in to save a guesthouse.', 401);
    const removing = ids.includes(id);
    try {
      if (removing) {
        await apiRequest<void>(`/api/favourites/${encodeURIComponent(id)}`, { method: 'DELETE', token });
        update(ids.filter((savedId) => savedId !== id));
        favouriteStays = favouriteStays.filter((stay) => stay.id !== id);
      } else {
        await apiRequest('/api/favourites', { method: 'POST', token, body: { guesthouseId: id } });
        if (listing && !favouriteStays.some((stay) => stay.id === id)) {
          favouriteStays = [...favouriteStays, listing];
        }
        update([...ids, id]);
      }
      setError(null);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) await logout();
      throw reason;
    }
  }, [ids, token]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { saved: ids, favourites: useSyncExternalStore(subscribeFavourites, () => favouriteStays, () => favouriteStays), toggleSaved, loading, error, retry };
}

function useSyncSaved() {
  return useSyncExternalStore(subscribe, () => saved, () => saved);
}

function subscribeFavourites(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
