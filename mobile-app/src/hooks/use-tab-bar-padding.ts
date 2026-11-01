import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarHeight } from '@/constants/theme';

// The floating bar sits 10px above the bottom inset (see floating-tabs.tsx), so content
// must clear that offset plus the bar height and a little breathing room.
export function useTabBarPadding(extra = 24) {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 10) + TabBarHeight + 10 + extra;
}
