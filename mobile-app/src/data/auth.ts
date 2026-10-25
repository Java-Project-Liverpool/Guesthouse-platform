import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useSyncExternalStore } from 'react';

import { ApiError, apiRequest } from '@/data/api';

export type User = { id: string; name: string; email: string; role: string };
type Session = { user: User; token: string } | null;
type AuthResponse = { token: string; user: { id?: string; _id?: string; name: string; email: string; role: string } };

const storageKey = 'dumela-auth-session';
let session: Session = null;
let restoring = true;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((listener) => listener());
}

function normaliseUser(user: AuthResponse['user']): User {
  return { id: user.id ?? user._id ?? '', name: user.name, email: user.email, role: user.role };
}

async function persist(next: Session) {
  if (Platform.OS === 'web') return;
  if (next) await SecureStore.setItemAsync(storageKey, JSON.stringify(next));
  else await SecureStore.deleteItemAsync(storageKey);
}

async function setSession(next: Session) {
  session = next;
  notify();
  await persist(next);
}

export async function restoreSession() {
  let restored: Session = null;
  try {
    if (Platform.OS !== 'web') {
      const stored = await SecureStore.getItemAsync(storageKey);
      if (stored) {
        const cached = JSON.parse(stored) as Session;
        if (cached?.token && cached.user) {
          restored = cached;
          session = cached;
        }
      }
    }
  } catch {
    session = null;
  } finally {
    restoring = false;
    notify();
  }

  // Show the cached account right away, then refresh it without blocking app launch.
  if (restored) {
    void apiRequest<{ user: AuthResponse['user'] }>('/api/auth/me', { token: restored.token })
      .then(async (result) => {
        if (session?.token !== restored?.token) return;
        session = { token: restored.token, user: normaliseUser(result.user) };
        notify();
        await persist(session);
      })
      .catch(async (error: unknown) => {
        if (session?.token !== restored?.token) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 404)) await logout();
        // Keep the saved session available while the API is temporarily unreachable.
      });
  }
}

export async function login(email: string, password: string) {
  const data = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST', body: { email, password },
  });
  if (!data.token || !data.user) throw new Error('The server did not return a valid sign-in session.');
  await setSession({ user: normaliseUser(data.user), token: data.token });
}

export async function register(name: string, email: string, password: string) {
  await apiRequest('/api/auth/register', { method: 'POST', body: { name, email, password } });
  // Public registration creates a customer but does not issue a token.
  await login(email, password);
}

export async function updateProfile(values: { name: string; email: string }) {
  if (!session) throw new ApiError('Sign in to update your profile.', 401);
  let result: { user: AuthResponse['user'] };
  try {
    result = await apiRequest<{ user: AuthResponse['user'] }>('/api/auth/profile', {
      method: 'PUT', token: session.token, body: values,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) await logout();
    throw error;
  }
  await setSession({ ...session, user: normaliseUser(result.user) });
}

export async function logout() {
  await setSession(null);
}

export function useAuth() {
  const current = useSyncExternalStore(subscribe, () => session, () => session);
  const isRestoring = useSyncExternalStore(subscribe, () => restoring, () => restoring);
  return { user: current?.user ?? null, token: current?.token ?? null, restoring: isRestoring };
}
