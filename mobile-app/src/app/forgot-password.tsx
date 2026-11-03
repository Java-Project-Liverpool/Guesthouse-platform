import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.primaryText} />
        </Pressable>

        <Text style={styles.brand}>Account help</Text>
        <Text style={styles.title}>Forgot password?</Text>

        <Text style={styles.body}>
          Password reset is not available through the current service yet. Please contact the Dumela Stays team to recover access to your account.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/login')}>
          <Text style={styles.primaryText}>Back to log in</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  brand: { fontSize: 14, color: colors.textSecondary },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2, marginBottom: 12 },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 28 },
  primaryButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  note: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});
