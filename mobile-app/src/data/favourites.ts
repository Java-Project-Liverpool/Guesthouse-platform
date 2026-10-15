import { useSyncExternalStore } from 'react';

// Saved stay ids, shared between the screens. Kept in memory only, so it resets when the app restarts.
let saved: string[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function update(next: string[]) {
  saved = next;
  listeners.forEach((listener) => listener());
}

export function useFavourites() {
  const ids = useSyncExternalStore(
    subscribe,
    () => saved,
    () => saved
  );

  const toggleSaved = (id: string) =>
    update(saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id]);

  return { saved: ids, toggleSaved };
}