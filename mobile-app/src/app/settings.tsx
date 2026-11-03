import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, logout as doLogout } from '@/data/auth';
import { useTheme } from '@/data/theme';
import { loadNotifications, saveNotifications } from '../data/settings';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function SettingsScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user } = useAuth();
  const { mode, toggle } = useTheme();
  const isDark = mode === 'dark';
  const [guesthouseUpdates, setGuesthouseUpdates] = useState(true);
  const [reviewsActivity, setReviewsActivity] = useState(true);
  const [promotions, setPromotions] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const n = await loadNotifications();
        setGuesthouseUpdates(n.updates);
        setReviewsActivity(n.reviews);
        setPromotions(n.promotions);
      } catch {}
    })();
  }, []);

  const saveNotis = (updates: boolean, reviews: boolean, promotions: boolean) => saveNotifications({ updates, reviews, promotions });

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <Row icon="create-outline" label="Edit profile" onPress={() => router.push('/edit-profile')} />
          <Row icon="key-outline" label="Change password" onPress={() => router.push('/change-password')} />
          <Row icon="information-circle-outline" label="Account information" onPress={() => router.push('/account-info')} last />
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="notifications-outline"
            label="Guesthouse updates"
            value={guesthouseUpdates}
            onToggle={() => { const v = !guesthouseUpdates; setGuesthouseUpdates(v); saveNotis(v, reviewsActivity, promotions); }}
           
          />
          <ToggleRow
            icon="chatbubble-outline"
            label="Review or comment activity"
            value={reviewsActivity}
            onToggle={() => { const v = !reviewsActivity; setReviewsActivity(v); saveNotis(guesthouseUpdates, v, promotions); }}
           
          />
          <ToggleRow
            icon="megaphone-outline"
            label="Promotional updates"
            value={promotions}
            onToggle={() => { const v = !promotions; setPromotions(v); saveNotis(guesthouseUpdates, reviewsActivity, v); }}
           
            last
          />
        </View>

        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.card}>
          <ToggleRow
            icon="sunny-outline"
            label="Light theme"
            value={!isDark}
            onToggle={() => { if (isDark) toggle(); }}
           
          />
          <ToggleRow
            icon="moon-outline"
            label="Dark theme"
            value={isDark}
            onToggle={() => { if (!isDark) toggle(); }}
           
            last
          />
        </View>

        <Text style={styles.sectionLabel}>Privacy & Security</Text>
        <View style={styles.card}>
          <Row icon="shield-checkmark-outline" label="Privacy information" onPress={() => router.push('/privacy')} />
          <Row icon="trash-outline" label="Delete account" onPress={() => router.push('/delete-account')} last />
        </View>

        <Text style={styles.sectionLabel}>Help & Support</Text>
        <View style={styles.card}>
          <Row icon="help-circle-outline" label="Help and FAQs" onPress={() => router.push('/help')} />
          <Row icon="mail-outline" label="Contact support" onPress={() => router.push('/support')} />
          <Row icon="flag-outline" label="Report a problem" onPress={() => router.push('/report')} last />
        </View>

        <Text style={styles.sectionLabel}>About Dumela Stays</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="leaf-outline" size={22} color={colors.primaryText} />
          </View>
          <Text style={styles.infoTitle}>Dumela Stays</Text>
          <Text style={styles.infoBody}>Guesthouse discovery for Botswana. Account recovery and push notifications are not available through the current service.</Text>
        </View>

        {user && (
          <Pressable style={styles.logoutButton} onPress={() => { if (typeof window !== 'undefined' && window.confirm ? window.confirm('Log out?') : true) { doLogout(); router.replace('/'); } }}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        )}

        <Text style={styles.version}>Dumela Stays · Version 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, onPress, last }: { icon: string; label: string; onPress?: () => void; last?: boolean }) {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable style={[styles.row, !last && styles.rowDivider]} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={styles.rowIcon}><Ionicons name={icon as any} size={20} color={colors.primaryText} /></View>
      <Text style={styles.rowText}>{label}</Text>
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
    </Pressable>
  );
}

function ToggleRow({ icon, label, value, onToggle, last }: { icon: string; label: string; value: boolean; onToggle: () => void; last?: boolean }) {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.toggleRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}> 
      <View style={styles.toggleLeft}>
        <View style={styles.rowIcon}><Ionicons name={icon as any} size={20} color={colors.primaryText} /></View>
        <Text style={styles.rowText} numberOfLines={1}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primaryText }}
        thumbColor={value ? colors.secondary : colors.onPrimary}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  backButtonSpace: { width: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  logoutButton: { height: 52, borderWidth: 1, borderColor: colors.error, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: colors.backgroundSecondary },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.error },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 22, marginBottom: 8 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  infoCard: { padding: 20, borderRadius: 16 },
  infoIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  infoTitle: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 6 },
  infoBody: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 14 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, flexShrink: 1, minWidth: 0 },
  rowText: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1, flexShrink: 1 },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  version: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
});
