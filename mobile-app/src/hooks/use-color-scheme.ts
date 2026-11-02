import { Platform } from 'react-native';
import { useTheme as useThemeStore } from '@/data/theme';

export function useColorScheme() {
  const theme = useThemeStore();
  if (Platform.OS === 'web') return 'light';
  return theme.mode;
}