import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY_THEME = 'dumela-theme';
const KEY_NOTIFICATIONS = 'dumela-notifications';

export async function loadTheme(): Promise<'light' | 'dark'> {
  if (Platform.OS === 'web') return 'light';
  try {
    const raw = await SecureStore.getItemAsync(KEY_THEME);
    return raw === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export async function saveTheme(mode: 'light' | 'dark') {
  if (Platform.OS === 'web') return;
  try { await SecureStore.setItemAsync(KEY_THEME, mode); } catch {}
}

export async function loadNotifications(): Promise<{ updates: boolean; reviews: boolean; promotions: boolean }> {
  if (Platform.OS === 'web') return { updates: true, reviews: true, promotions: false };
  try {
    const raw = await SecureStore.getItemAsync(KEY_NOTIFICATIONS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { updates: true, reviews: true, promotions: false };
}

export async function saveNotifications(prefs: { updates: boolean; reviews: boolean; promotions: boolean }) {
  if (Platform.OS === 'web') return;
  try { await SecureStore.setItemAsync(KEY_NOTIFICATIONS, JSON.stringify(prefs)); } catch {}
}
