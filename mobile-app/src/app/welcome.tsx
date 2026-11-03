import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function WelcomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.top}>
          <View style={styles.logoTile}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.brand}>Dumela Stays</Text>
          <Text style={styles.title}>Discover guesthouses across Botswana</Text>
          <Text style={styles.body}>
            Search, compare prices and ratings, and save your favourites.
          </Text>
        </View>

        <View>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryText}>Start browsing</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => router.push('/login')}>
            <Text style={styles.outlineText}>Log in or sign up</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  top: { alignItems: 'flex-start' },
  logoTile: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: { width: 54, height: 54 },
  brand: { fontSize: 14, color: colors.textSecondary },
  title: { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: 4, marginBottom: 14 },
  body: { fontSize: 16, color: colors.textSecondary, lineHeight: 24 },
  primaryButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  outlineButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontSize: 16, fontWeight: '700', color: colors.primaryText },
});