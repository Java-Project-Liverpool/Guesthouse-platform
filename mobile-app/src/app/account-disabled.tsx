import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { clearAccountSuspension } from '@/data/auth';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function AccountDisabledScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={34} color={colors.primaryText} />
        </View>
        <Text style={styles.title}>Account suspended</Text>
        <Text style={styles.body}>
          Your account has been suspended. Please contact the Dumela Stays team through its official support channel.
        </Text>

        <Pressable style={styles.primaryButton} onPress={() => { clearAccountSuspension(); router.replace('/login'); }}>
          <Text style={styles.primaryText}>Return to sign in</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => { clearAccountSuspension(); router.replace('/'); }}>
          <Text style={styles.outlineText}>Continue as guest</Text>
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
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
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
