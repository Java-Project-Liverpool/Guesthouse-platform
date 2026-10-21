import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder: replace with the team's real support address
const SUPPORT_EMAIL = 'support@example.com';

const colors = {
  background: '#F7F5F0',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  chip: '#EEF1EC',
};

export default function AccountDisabledScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={34} color={colors.dark} />
        </View>
        <Text style={styles.title}>Account disabled</Text>
        <Text style={styles.body}>
          Your account has been disabled by an admin. Contact support to find out why.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => Linking.openURL('mailto:' + SUPPORT_EMAIL)}>
          <Text style={styles.primaryText}>Contact support</Text>
        </Pressable>
        <Pressable style={styles.outlineButton} onPress={() => router.replace('/')}>
          <Text style={styles.outlineText}>Continue as guest</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 32,
  },
  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  outlineButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontSize: 16, fontWeight: '700', color: colors.dark },
});