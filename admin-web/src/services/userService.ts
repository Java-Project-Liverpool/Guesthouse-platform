import { ApiError, apiFetch } from './api';
import type { User } from '../types';

export async function suspendCustomer(id: string, isActive: boolean): Promise<{ message: string; user: User }> {
  const result = await apiFetch<unknown>(`/admin/customers/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  });

  if (
    typeof result !== 'object' || result === null ||
    !('message' in result) || typeof result.message !== 'string' ||
    !('user' in result) || typeof result.user !== 'object' || result.user === null ||
    !('_id' in result.user) || typeof result.user._id !== 'string' ||
    !('isActive' in result.user) || typeof result.user.isActive !== 'boolean' ||
    result.user.isActive !== isActive
  ) {
    throw new ApiError('The server returned an unexpected customer status response.', 502);
  }

  return result as { message: string; user: User };
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ message: string; user: User }> {
  return apiFetch<{ message: string; user: User }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCurrentUser(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/me');
}

export async function getAdminUsers(): Promise<{ users: User[] }> {
  return apiFetch<{ users: User[] }>('/admin/users');
}

export async function getCustomerUsers(): Promise<{ users: User[] }> {
  return apiFetch<{ users: User[] }>('/admin/customers');
}

export async function updateProfile(profile: {
  name?: string;
  email?: string;
}): Promise<{ message: string; user: User }> {
  return apiFetch<{ message: string; user: User }>('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function updatePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  return apiFetch<{ message: string }>('/auth/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
