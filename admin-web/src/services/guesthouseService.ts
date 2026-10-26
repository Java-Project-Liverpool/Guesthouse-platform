import { apiFetch } from './api';
import type { DashboardStats, Guesthouse, Rating } from '../types';

export interface SearchGuesthouseParams {
  name?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: string[];
  sortBy?: string;
  verified?: boolean;
  page?: number;
  limit?: number;
  includeHidden?: boolean;
}

export interface SearchGuesthouseResponse {
  guesthouses: Guesthouse[];
  total: number;
  page: number;
  limit: number;
}

export async function getAllGuesthouses(): Promise<{ guesthouses: Guesthouse[] }> {
  return apiFetch<{ guesthouses: Guesthouse[] }>('/guesthouses');
}

export async function searchGuesthouses(
  params: SearchGuesthouseParams = {}
): Promise<SearchGuesthouseResponse> {
  const query = new URLSearchParams();

  if (params.name) query.append('name', params.name);
  if (params.city && params.city !== 'All' && params.city !== 'All cities') {
    query.append('city', params.city);
  }
  if (params.minPrice !== undefined) query.append('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) query.append('maxPrice', String(params.maxPrice));
  if (params.minRating !== undefined) query.append('minRating', String(params.minRating));
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.verified) query.append('verified', 'true');
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.includeHidden) query.append('includeHidden', 'true');

  const qs = query.toString();
  return apiFetch<SearchGuesthouseResponse>(`/guesthouses/search${qs ? `?${qs}` : ''}`);
}

export async function getGuesthouseById(id: string): Promise<{ guesthouse: Guesthouse }> {
  return apiFetch<{ guesthouse: Guesthouse }>(`/guesthouses/${id}`);
}

export async function createGuesthouse(
  data: Partial<Guesthouse>
): Promise<{ guesthouse: Guesthouse }> {
  return apiFetch<{ guesthouse: Guesthouse }>('/guesthouses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGuesthouse(
  id: string,
  data: Partial<Guesthouse>
): Promise<{ guesthouse: Guesthouse }> {
  return apiFetch<{ guesthouse: Guesthouse }>(`/guesthouses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function setGuesthouseVisibility(
  id: string,
  isActive: boolean
): Promise<{ guesthouse?: Guesthouse } | void> {
  if (!isActive) {
    // Calling DELETE /api/guesthouses/:id deactivates (sets isActive: false) per backend design
    return apiFetch(`/guesthouses/${id}`, { method: 'DELETE' });
  } else {
    // Reactivating
    return apiFetch<{ guesthouse: Guesthouse }>(`/guesthouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: true }),
    });
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/admin/stats');
}

export async function getGuesthouseRatings(id: string): Promise<{ ratings: Rating[] }> {
  return apiFetch<{ ratings: Rating[] }>(`/guesthouses/${id}/ratings`);
}

export async function uploadGuesthouseImage(
  file: File,
  type: 'logo' | 'gallery'
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append('image', file);

  return apiFetch<{ url: string; publicId: string }>(`/uploads/image?type=${type}`, {
    method: 'POST',
    body: formData,
  });
}
