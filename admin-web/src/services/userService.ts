import { apiFetch } from './api';
import type { User } from '../types';

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
