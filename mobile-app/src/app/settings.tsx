import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
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

const appearanceOptions = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
] as const;

function LinkRow({ label, last }: { label: string; last?: boolean }) {
  return (
    // These screens are not built yet, so the rows do nothing for now
    <Pressable style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // Appearance and notifications are kept on this screen only for now
  const [appearance, setAppearance] = useState<'light' | 'dark' | 'system'>('light');
  const [push, setPush] = useState(true);

  const logout = () => {
    doLogout();
    router.replace('/');
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your account, favourites and ratings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          // Placeholder: when the backend is connected, call the delete route first
          onPress: logout,
        },
      ]
    );
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

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.track}>
          {appearanceOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[styles.option, appearance === option.key && styles.optionActive]}
              onPress={() => setAppearance(option.key)}>
              <Text style={[styles.optionText, appearance === option.key && styles.optionTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notifications and links */}
        <View style={[styles.card, styles.list]}>
          <View style={[styles.row, styles.rowDivider]}>
            <Text style={styles.rowText}>Push notifications</Text>
            <Switch
              value={push}
              onValueChange={setPush}
              trackColor={{ true: colors.dark, false: colors.chip }}
            />
          </View>
          {user && <LinkRow label="Change password" />}
          <LinkRow label="Privacy policy" />
          <LinkRow label="Help and support" last />
        </View>

        {/* Account actions (logged-in customers only) */}
        {user && (
          <>
            <Pressable style={styles.logoutButton} onPress={logout}>
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={confirmDelete}>
              <Text style={styles.deleteText}>Delete account</Text>
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
  track: {
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: colors.chip,
    borderRadius: 16,
    marginBottom: 22,
  },
  option: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  optionActive: { backgroundColor: colors.dark },
  optionText: { fontSize: 14, fontWeight: '700', color: colors.text },
  optionTextActive: { color: '#FFFFFF' },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginBottom: 22,
  },
  list: { paddingHorizontal: 20 },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 16, fontWeight: '700', color: colors.text },

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
  deleteButton: { height: 54, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 16, fontWeight: '700', color: colors.danger },

  version: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 12 },
});