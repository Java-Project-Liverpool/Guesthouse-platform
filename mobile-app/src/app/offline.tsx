import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function OfflineScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="cloud-offline-outline" size={34} color={colors.primaryText} />
        </View>
        <Text style={styles.label}>You are offline</Text>
        <Text style={styles.title}>No internet connection</Text>
        <Text style={styles.body}>Check your Wi-Fi or mobile data and try again.</Text>

        {/* Goes back to Home, which loads the stays again */}
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryText}>Try again</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => router.replace('/favourites')}>
          <Text style={styles.outlineText}>View saved favourites</Text>
        </Pressable>
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
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  label: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 4 },
  body: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 32,
  },
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