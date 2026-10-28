import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { restoreSession, useAuth, validateSession } from '@/data/auth';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const pathname = usePathname();
  const { accountSuspended, user } = useAuth();
  const userId = user?.id;
  const userRole = user?.role;
  useEffect(() => {
    void restoreSession();
  }, []);
  useEffect(() => {
    if (accountSuspended && pathname !== '/account-disabled') {
      router.replace('/account-disabled');
    }
  }, [accountSuspended, pathname, router]);
  useEffect(() => {
    if (!userId) return;
    const checkSession = () => void validateSession();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkSession();
    });
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [userId, userRole]);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
