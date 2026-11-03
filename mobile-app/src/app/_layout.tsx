import { DarkTheme, DefaultTheme, Stack, ThemeProvider, usePathname, useRouter } from 'expo-router';
import { NavigationBar } from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { restoreSession, useAuth, validateSession } from '@/data/auth';
import { restoreTheme, useTheme } from '@/data/theme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const { mode } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { accountSuspended, user } = useAuth();
  const userId = user?.id;
  const userRole = user?.role;
  
  useEffect(() => {
    void restoreSession();
  }, []);
  
  useEffect(() => {
    void restoreTheme();
  }, []);
  
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const hideNavigationBar = () => NavigationBar.setHidden(true);
    hideNavigationBar();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') hideNavigationBar();
    });
    return () => subscription.remove();
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
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 250,
          animationTypeForReplace: 'pop',
        }}
      >
        <Stack.Screen name="details" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="compare" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="reviews" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'fade' }} />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="change-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account-info" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="delete-account" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="login" options={{ animation: 'fade', animationTypeForReplace: 'push' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      </Stack>
    </ThemeProvider>
  );
}