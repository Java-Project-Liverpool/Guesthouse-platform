import { useSyncExternalStore } from 'react';

export type User = { id: string; name: string; email: string; role: string };
type Session = { user: User; token: string } | null;

// Set in mobile-app/.env.local, for example EXPO_PUBLIC_API_URL=http://localhost:5000
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// The signed-in user, shared between the screens. Kept in memory only,
// so you are signed out when the app restarts (the backend token also expires after 1 hour).
let session: Session = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setSession(next: Session) {
  session = next;
  listeners.forEach((listener) => listener());
}

// Sends a POST request to the backend. Returns the JSON, or throws an Error with a readable message.
async function post(path: string, body: object) {
  if (!API_URL) {
    throw new Error('The backend is not connected yet.');
  }

  let response: Response;
  try {
    response = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Validation problems come back as { message, errors: { field: text } }
    const details = data.errors ? Object.values(data.errors).join(' ') : '';
    throw new Error(details || data.message || 'Something went wrong.');
  }

  return data;
}

export async function login(email: string, password: string) {
  const data = await post('/api/auth/login', { email, password });
  setSession({ user: data.user, token: data.token });
}

// The backend does not return a token when registering, so we log in straight after
export async function register(name: string, email: string, password: string) {
  await post('/api/auth/register', { name, email, password });
  await login(email, password);
}

export function logout() {
  setSession(null);
}

export function useAuth() {
  const current = useSyncExternalStore(
    subscribe,
    () => session,
    () => session
  );

  return { user: current?.user ?? null, token: current?.token ?? null };
}