/**
 * Theme hook reading from persisted user preference.
 */
import { Colors } from '@/constants/theme';
import { useTheme as useThemeStore } from '@/data/theme';

export function useTheme() {
  const mode = useThemeStore().mode;
  const theme = mode === 'dark' ? Colors.dark : Colors.light;
  return theme;
}