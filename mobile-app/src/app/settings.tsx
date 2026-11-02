import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, logout as doLogout } from '@/data/auth';
import { useTheme } from '@/data/theme';
import { loadNotifications, saveNotifications } from '../data/settings';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#C8CEC8',
  chip: '#EEF1EC',
  danger: '#B3261E',
  accent: '#B7650A',
};

export default function SettingsScreen() {
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
    <SafeAreaView style={[styles.screen, isDark && { backgroundColor: '#121F1B' }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={[styles.headerTitle, isDark && { color: '#EAECE8' }]}>Settings</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <Text style={[styles.sectionLabel, isDark && { color: '#8FA99A' }]}>Account</Text>
        <View style={[styles.card, isDark && { backgroundColor: '#1A2B24', borderColor: '#2C3D36' }]}>
          <Row icon="create-outline" label="Edit profile" onPress={() => router.push('/edit-profile')} dark={isDark} />
          <Row icon="key-outline" label="Change password" onPress={() => router.push('/change-password')} dark={isDark} />
          <Row icon="information-circle-outline" label="Account information" onPress={() => router.push('/account-info')} last dark={isDark} />
        </View>

        <Text style={[styles.sectionLabel, isDark && { color: '#8FA99A' }]}>Notifications</Text>
        <View style={[styles.card, isDark && { backgroundColor: '#1A2B24', borderColor: '#2C3D36' }]}>
          <ToggleRow
            icon="notifications-outline"
            label="Guesthouse updates"
            value={guesthouseUpdates}
            onToggle={() => { const v = !guesthouseUpdates; setGuesthouseUpdates(v); saveNotis(v, reviewsActivity, promotions); }}
            dark={isDark}
          />
          <ToggleRow
            icon="chatbubble-outline"
            label="Review or comment activity"
            value={reviewsActivity}
            onToggle={() => { const v = !reviewsActivity; setReviewsActivity(v); saveNotis(guesthouseUpdates, v, promotions); }}
            dark={isDark}
          />
          <ToggleRow
            icon="megaphone-outline"
            label="Promotional updates"
            value={promotions}
            onToggle={() => { const v = !promotions; setPromotions(v); saveNotis(guesthouseUpdates, reviewsActivity, v); }}
            dark={isDark}
            last
          />
        </View>

        <Text style={[styles.sectionLabel, isDark && { color: '#8FA99A' }]}>Appearance</Text>
        <View style={[styles.card, isDark && { backgroundColor: '#1A2B24', borderColor: '#2C3D36' }]}>
          <ToggleRow
            icon="sunny-outline"
            label="Light theme"
            value={!isDark}
            onToggle={() => { if (isDark) toggle(); }}
            dark={isDark}
          />
          <ToggleRow
            icon="moon-outline"
            label="Dark theme"
            value={isDark}
            onToggle={() => { if (!isDark) toggle(); }}
            dark={isDark}
            last
          />
        </View>

        <Text style={[styles.sectionLabel, isDark && { color: '#8FA99A' }]}>Privacy & Security</Text>
        <View style={[styles.card, isDark && { backgroundColor: '#1A2B24', borderColor: '#2C3D36' }]}>
          <Row icon="shield-checkmark-outline" label="Privacy information" onPress={() => router.push('/privacy')} dark={isDark} />
          <Row icon="trash-outline" label="Delete account" onPress={() => router.push('/delete-account')} dark={isDark} last />
        </View>

        <Text style={[styles.sectionLabel, isDark && { color: '#8FA99A' }]}>Help & Support</Text>
        <View style={[styles.card, isDark && { backgroundColor: '#1A2B24', borderColor: '#2C3D36' }]}>
          <Row icon="help-circle-outline" label="Help and FAQs" onPress={() => router.push('/help')} dark={isDark} />
          <Row icon="mail-outline" label="Contact support" onPress={() => router.push('/support')} dark={isDark} />
          <Row icon="flag-outline" label="Report a problem" onPress={() => router.push('/report')} dark={isDark} last />
        </View>

        <Text style={[styles.sectionLabel, isDark && { color: '#8FA99A' }]}>About Dumela Stays</Text>
        <View style={[styles.infoCard, isDark && { backgroundColor: '#1A2B24', borderColor: '#2C3D36' }]}>
          <View style={[styles.infoIcon, isDark && { backgroundColor: '#2C3D36' }]}>
            <Ionicons name="leaf-outline" size={22} color={colors.dark} />
          </View>
          <Text style={[styles.infoTitle, isDark && { color: '#EAECE8' }]}>Dumela Stays</Text>
          <Text style={[styles.infoBody, isDark && { color: '#8FA99A' }]}>Guesthouse discovery for Botswana. Account recovery and push notifications are not available through the current service.</Text>
        </View>

        {user && (
          <Pressable style={[styles.logoutButton, isDark && { borderColor: '#B3261E', backgroundColor: '#2A1816' }]} onPress={() => { if (typeof window !== 'undefined' && window.confirm ? window.confirm('Log out?') : true) { doLogout(); router.replace('/'); } }}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        )}

        <Text style={[styles.version, isDark && { color: '#5A6B68' }]}>Dumela Stays · Version 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ icon, label, onPress, last, dark }: { icon: string; label: string; onPress?: () => void; last?: boolean; dark?: boolean }) {
  return (
    <Pressable style={[styles.row, !last && styles.rowDivider, dark && { borderBottomColor: '#2C3D36' }]} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <View style={[styles.rowIcon, dark && { backgroundColor: '#2C3D36' }]}><Ionicons name={icon as any} size={20} color={colors.dark} /></View>
      <Text style={[styles.rowText, dark && { color: '#EAECE8' }]}>{label}</Text>
      {onPress && <Ionicons name="chevron-forward" size={18} color={dark ? '#6E8078' : colors.muted} />}
    </Pressable>
  );
}

function ToggleRow({ icon, label, value, onToggle, last, dark }: { icon: string; label: string; value: boolean; onToggle: () => void; last?: boolean; dark?: boolean }) {
  return (
    <View style={[styles.toggleRow, !last && { borderBottomWidth: 1, borderBottomColor: dark ? '#2C3D36' : colors.border }]}> 
      <View style={styles.toggleLeft}>
        <View style={[styles.rowIcon, dark && { backgroundColor: '#2C3D36' }]}><Ionicons name={icon as any} size={20} color={colors.dark} /></View>
        <Text style={[styles.rowText, dark && { color: '#EAECE8' }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: dark ? '#3A4D45' : '#C8CEC8', true: colors.dark }}
        thumbColor={value ? colors.accent : '#FFFFFF'}
        ios_backgroundColor={dark ? '#3A4D45' : '#C8CEC8'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  backButtonSpace: { width: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 22, marginBottom: 8 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
  infoCard: { padding: 20, borderRadius: 16 },
  infoIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  infoTitle: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 6 },
  infoBody: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, paddingHorizontal: 14 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { fontSize: 15, fontWeight: '600', color: colors.text, flex: 1 },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  logoutButton: { height: 52, borderWidth: 1, borderColor: colors.danger, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: '#FFF5F5' },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger },
  version: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4 },
});
