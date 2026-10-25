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

import { MaxContentWidth, Spacing } from '@/constants/theme';

const colors = {
  bar: '#14352A',
  activePill: '#FFFFFF',
  activeText: '#14352A',
  inactiveText: '#D5DED8',
};

// The bar only shows on the three main tabs
const TAB_PATHS = ['/', '/favourites', '/account'];

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
          {/* Screens that are not tabs */}
          <TabTrigger name="details" href="/details" style={{ display: 'none' }} />
          <TabTrigger name="search" href="/search" style={{ display: 'none' }} />
          <TabTrigger name="explore" href="/explore" style={{ display: 'none' }} />
          <TabTrigger name="settings" href="/settings" style={{ display: 'none' }} />
          <TabTrigger name="edit-profile" href="/edit-profile" style={{ display: 'none' }} />
          <TabTrigger name="forgot-password" href="/forgot-password" style={{ display: 'none' }} />
          <TabTrigger name="reviews" href="/reviews" style={{ display: 'none' }} />
          <TabTrigger name="write-review" href="/write-review" style={{ display: 'none' }} />
          <TabTrigger name="compare" href="/compare" style={{ display: 'none' }} />
          <TabTrigger name="gallery" href="/gallery" style={{ display: 'none' }} />
                    <TabTrigger name="welcome" href={'/welcome' as never} style={{ display: 'none' }} />
          <TabTrigger name="account-disabled" href={'/account-disabled' as never} style={{ display: 'none' }} />
          <TabTrigger name="offline" href="/offline" style={{ display: 'none' }} />
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <View style={[styles.tabButtonView, isFocused && styles.tabButtonActive]}>
        <Text style={[styles.tabText, isFocused && styles.tabTextActive]}>{children}</Text>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
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

const styles = StyleSheet.create({
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
    backgroundColor: colors.bar,
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
    backgroundColor: colors.activePill,
  },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.inactiveText },
  tabTextActive: { color: colors.activeText },
});