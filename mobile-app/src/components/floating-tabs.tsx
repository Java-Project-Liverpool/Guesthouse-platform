import { Ionicons } from '@expo/vector-icons';
import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';

import { Radii, type AppPalette } from '@/constants/theme';
import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';

type TabButtonProps = Omit<TabTriggerSlotProps, 'ref'> & {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  activeIcon: ComponentProps<typeof Ionicons>['name'];
};

function TabButton({ label, icon, activeIcon, isFocused, ...pressableProps }: TabButtonProps) {
  const colors = useAppColors();
  const styles = useTabStyles();
  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      <View style={[styles.tabContent, isFocused && styles.tabContentActive]}>
        <Ionicons
          name={isFocused ? activeIcon : icon}
          size={20}
          color={isFocused ? colors.dark : colors.tabBarInactive}
        />
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function FloatingTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();
  const styles = useTabStyles();
  return (
    <View
      {...props}
      style={[
        styles.position,
        props.style,
        { bottom: Math.max(insets.bottom, 10) + 10 },
      ]}>
      <View style={styles.bar}>{props.children}</View>
    </View>
  );
}

export default function FloatingTabs() {
  const styles = useTabStyles();
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <FloatingTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton label="Home" icon="home-outline" activeIcon="home" />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton label="Explore" icon="compass-outline" activeIcon="compass" />
          </TabTrigger>
          <TabTrigger name="favourites" href="/favourites" asChild>
            <TabButton label="Saved" icon="heart-outline" activeIcon="heart" />
          </TabTrigger>
          <TabTrigger name="account" href="/account" asChild>
            <TabButton label="Account" icon="person-outline" activeIcon="person" />
          </TabTrigger>
        </FloatingTabList>
      </TabList>
    </Tabs>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  slot: { flex: 1 },
  position: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: '100%',
    maxWidth: 440,
    minHeight: 56,
    padding: 6,
    borderRadius: Radii.pill,
    backgroundColor: colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.overlay,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  tabPressable: { flex: 1, borderRadius: Radii.pill, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  pressed: { opacity: 0.82 },
  tabContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  tabContentActive: { backgroundColor: colors.onPrimary, borderRadius: Radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tabLabel: { fontSize: 10, fontWeight: '500', color: colors.tabBarInactive, marginTop: 2 },
  tabLabelActive: { color: colors.dark, fontWeight: '700' },
});

const useTabStyles = () => useThemedStyles(makeStyles);
