import { useMemo } from 'react';
import { AppColors, type AppPalette } from '@/constants/theme';
import { useTheme } from '@/data/theme';

export function useAppColors(): AppPalette {
  const { mode } = useTheme();
  return AppColors[mode];
}

export function useThemedStyles<T>(factory: (colors: AppPalette) => T): T {
  const colors = useAppColors();
  return useMemo(() => factory(colors), [colors, factory]);
}
