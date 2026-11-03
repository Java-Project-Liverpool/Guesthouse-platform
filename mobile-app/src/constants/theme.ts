/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export type AppPalette = {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceElevated: string;
  card: string;
  primary: string;
  primaryText: string;
  primaryLight: string;
  secondary: string;
  info: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  divider: string;
  inputBackground: string;
  placeholder: string;
  icon: string;
  success: string;
  warning: string;
  error: string;
  overlay: string;
  tabBar: string;
  tabBarActive: string;
  tab: string;
  tabBarInactive: string;
  onPrimary: string;
  onSecondary: string;
  skeleton: string;
  skeletonHighlight: string;
  chip: string;
  heart: string;
  star: string;
  danger: string;
  dark: string;
  backgroundElement: string;
  backgroundSelected: string;
};

export const AppColors: Record<'light' | 'dark', AppPalette> = {
  light: {
    background: '#F7F5F0',
    backgroundSecondary: '#EEF1EC',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    card: '#FFFFFF',
    primary: '#14352A',
    primaryText: '#14352A',
    primaryLight: '#8FA99A',
    secondary: '#B7650A',
    info: '#0274DF',
    text: '#15201A',
    textSecondary: '#5F6B64',
    textMuted: '#7D8A83',
    border: '#C8CEC8',
    divider: '#E1E5E0',
    inputBackground: '#FFFFFF',
    placeholder: '#8A948E',
    icon: '#14352A',
    success: '#2E7D32',
    warning: '#B7650A',
    error: '#B3261E',
    overlay: 'rgba(0,0,0,0.45)',
    tabBar: '#FFFFFF',
    tabBarActive: '#14352A',
    tab: '#5F6B64',
    tabBarInactive: '#E1E9E3',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    skeleton: '#E8E5DB',
    skeletonHighlight: '#F2F0EB',
    chip: '#EEF1EC',
    heart: '#C0392B',
    star: '#B7650A',
    danger: '#B3261E',
    dark: '#14352A',
    backgroundElement: '#EEF1EC',
    backgroundSelected: '#E1E5E0',
  },
  dark: {
    background: '#0B0F0D',
    backgroundSecondary: '#121F1B',
    surface: '#1A2B24',
    surfaceElevated: '#26332D',
    card: '#1A2B24',
    primary: '#2C5A46',
    primaryText: '#8FD3B0',
    primaryLight: '#8FA99A',
    secondary: '#DFA36F',
    info: '#5AA9FF',
    text: '#EAECE8',
    textSecondary: '#B0B4BA',
    textMuted: '#6E8078',
    border: '#2C3D36',
    divider: '#26332D',
    inputBackground: '#121F1B',
    placeholder: '#6E8078',
    icon: '#EAECE8',
    success: '#66BB6A',
    warning: '#DFA36F',
    error: '#F2776E',
    overlay: 'rgba(0,0,0,0.6)',
    tabBar: '#121F1B',
    tabBarActive: '#EAECE8',
    tab: '#6E8078',
    tabBarInactive: '#E1E9E3',
    onPrimary: '#FFFFFF',
    onSecondary: '#0B0F0D',
    skeleton: '#1A2B24',
    skeletonHighlight: '#26332D',
    chip: '#1A2B24',
    heart: '#F2776E',
    star: '#DFA36F',
    danger: '#F2776E',
    dark: '#2C5A46',
    backgroundElement: '#1A2B24',
    backgroundSelected: '#26332D',
  },
};

export type ThemeColor = keyof AppPalette;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Radii = {
  card: 16,
  pill: 9999,
  control: 12,
  sm: 8,
  md: 12,
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Typography = {
  screenTitle: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  section: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  cardTitle: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  supporting: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  metadata: { fontSize: 11, fontWeight: '400', lineHeight: 14 },
  cardTitleLarge: { fontSize: 18, fontWeight: '700', lineHeight: 24 },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const TabBarHeight = 56;
export const MaxContentWidth = 800;
