import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favourites">
        <NativeTabs.Trigger.Label>Favourites</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {/* Screens that are not tabs */}
            {/* Screens that are not tabs */}
      <NativeTabs.Trigger name="login" hidden />
      <NativeTabs.Trigger name="details" hidden />
      <NativeTabs.Trigger name="search" hidden />
      <NativeTabs.Trigger name="explore" hidden />
      <NativeTabs.Trigger name="settings" hidden />
      <NativeTabs.Trigger name="edit-profile" hidden />
      <NativeTabs.Trigger name="forgot-password" hidden />
      <NativeTabs.Trigger name="reviews" hidden />
      <NativeTabs.Trigger name="write-review" hidden />
      <NativeTabs.Trigger name="compare" hidden />
      <NativeTabs.Trigger name="gallery" hidden />
      <NativeTabs.Trigger name="welcome" hidden />
      <NativeTabs.Trigger name="account-disabled" hidden />
      <NativeTabs.Trigger name="offline" hidden />
    </NativeTabs>
  );
}