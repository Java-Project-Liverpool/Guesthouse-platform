import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout as doLogout, useAuth } from '@/data/auth';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#E1E5E0',
  chip: '#EEF1EC',
  danger: '#B3261E',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const logout = () => {
    void doLogout();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <Text style={styles.sectionTitle}>App information</Text>
        <View style={[styles.card, styles.infoCard]}>
          <View style={styles.infoIcon}><Ionicons name="leaf-outline" size={22} color={colors.dark} /></View>
          <Text style={styles.infoTitle}>Dumela Stays</Text>
          <Text style={styles.infoBody}>Guesthouse discovery for Botswana. Account recovery and push notifications are not available through the current service.</Text>
        </View>

        {/* Account actions (logged-in customers only) */}
        {user && (
          <>
            <Pressable style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.version}>Dumela Stays · Version 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonSpace: { width: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginBottom: 22,
  },
  infoCard: { padding: 20 },
  infoIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  infoTitle: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 6 },
  infoBody: { fontSize: 15, color: colors.muted, lineHeight: 22 },

  logoutButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.dark },

  version: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 12 },
});
