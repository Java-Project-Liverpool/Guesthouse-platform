import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout, useAuth } from '@/data/auth';
import { useFavourites } from '@/data/favourites';
import { useTabBarPadding } from '@/hooks/use-tab-bar-padding';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

type RowProps = {
  label: string;
  value?: string | number;
  onPress: () => void;
  last?: boolean;
};

function Row({ label, value, onPress, last }: RowProps) {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable style={[styles.row, !last && styles.rowDivider]} onPress={onPress}>
      <Text style={styles.rowText}>{label}</Text>
      <View style={styles.rowRight}>
        {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

export default function AccountScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const tabBarPadding = useTabBarPadding();
  const { user, restoring } = useAuth();
  const { saved } = useFavourites();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const handleLogoutConfirm = () => {
    void logout();
    setConfirmLogout(false);
    router.replace('/');
  };

  if (restoring) return <SafeAreaView style={styles.screen}><ActivityIndicator size="large" color={colors.primaryText} /></SafeAreaView>;

  // Guest view: browsing works without an account, so explain what an account adds
  if (!user) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]}>
          <Text style={styles.title}>Account</Text>

          <View style={[styles.card, styles.guestCard]}>
            <View style={styles.iconTile}>
              <Ionicons name="person-outline" size={24} color={colors.primaryText} />
            </View>
            <Text style={styles.cardTitle}>You are browsing as a guest</Text>
            <Text style={styles.cardBody}>
              Log in to save favourites, rate guesthouses and write reviews.
            </Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryText}>Log in or sign up</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const initials =
    user.name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]}>
        <Text style={styles.title}>Account</Text>

        {/* Profile */}
        <View style={[styles.card, styles.profile]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        {/* Links */}
        <View style={[styles.card, styles.list]}>
          <Row label="My favourites" value={saved.length} onPress={() => router.push('/favourites')} />
          <Row label="Settings" onPress={() => router.push('/settings')} last />
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={() => setConfirmLogout(true)}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        {/* Confirmation dialog */}
        {confirmLogout && (
          <View style={styles.modalBackdrop}>
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log out</Text>
              </View>
              <Text style={styles.modalBody}>
                Are you sure you want to log out? You will need to sign in again to access your saved stays and reviews.
              </Text>
              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancel} onPress={() => setConfirmLogout(false)}>
                  <Text style={styles.modalCancelText}>Not now</Text>
                </Pressable>
                <Pressable style={styles.modalConfirm} onPress={handleLogoutConfirm}>
                  <Text style={styles.modalConfirmText}>Log out</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
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
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 24 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 20,
    marginBottom: 20,
  },

  // Guest
  guestCard: { padding: 20 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  cardBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },

  // Profile
  profile: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: colors.primaryText },
  profileText: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },

  // Link rows
  list: { paddingHorizontal: 20 },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowText: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },

  // Buttons
  primaryButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  logoutButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.primaryText },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 },
  modalHeader: { marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalCancel: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: colors.divider },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  modalConfirm: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: colors.error },
  modalConfirmText: { fontSize: 15, fontWeight: '700', color: colors.onPrimary },
});
