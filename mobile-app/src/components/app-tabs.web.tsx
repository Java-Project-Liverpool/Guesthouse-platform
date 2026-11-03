import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Spacing, type AppPalette } from '@/constants/theme';


import { useThemedStyles } from '@/hooks/use-app-colors';

// The bar only shows on the three main tabs
const TAB_PATHS = ['/', '/explore', '/favourites', '/account'];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="favourites" href="/favourites" asChild>
            <TabButton>Favourites</TabButton>
          </TabTrigger>
          <TabTrigger name="account" href="/account" asChild>
            <TabButton>Account</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const styles = useThemedStyles(makeStyles);
  const { ref: _ref, ...pressableProps } = props as any;
  return (
    <Pressable {...pressableProps} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonActive]}>
        <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>{children}</Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const styles = useThemedStyles(makeStyles);
  const pathname = usePathname();
  // Hide the bar on screens that are not tabs
  const hideBar = !TAB_PATHS.includes(pathname);

  return (
    <View
      {...props}
      style={[styles.tabListContainer, hideBar && { display: 'none' }]}>
      <View style={styles.innerContainer}>{props.children}</View>
    </View>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
  },
  tabButtonActive: {
    backgroundColor: colors.surface,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.border },
  tabTextActive: { color: colors.primaryText },
});