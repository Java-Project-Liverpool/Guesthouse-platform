import { useSyncExternalStore } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'dumela-theme';

type Theme = 'light' | 'dark';

let current: Theme = 'light';
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

export async function loadTheme(): Promise<Theme> {
  if (Platform.OS === 'web') return 'light';
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export async function saveTheme(mode: Theme) {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.setItemAsync(KEY, mode);
    current = mode;
    notify();
  } catch {}
}

export function restoreTheme(): Promise<Theme> {
  return loadTheme().then((t) => {
    current = t;
    notify();
    return t;
  });
}

export function useTheme() {
  const mode = useSyncExternalStore(subscribe, () => current, () => current);
  return { mode, isDark: mode === 'dark', toggle: () => saveTheme(mode === 'dark' ? 'light' : 'dark') };
}
