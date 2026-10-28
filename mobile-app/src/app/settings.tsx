import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/data/auth';
import { logout as doLogout } from '@/data/auth';
import { loadTheme, saveTheme, loadNotifications, saveNotifications } from '../data/settings';

type RowProps = { label: string; icon: string; onPress?: () => void; value?: string; last?: boolean };

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function Row({ label, icon, onPress, value, last }: RowProps) {
  return (
    <Pressable style={[styles.row, !last && styles.rowDivider]} onPress={onPress}>
      <View style={styles.rowIcon}><Ionicons name={icon as any} size={20} color={colors.dark} /></View>
      <Text style={styles.rowText}>{label}</Text>
      {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </Pressable>
  );
}

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#C8CEC8',
  chip: '#EEF1EC',
  danger: '#B3261E',
};

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [darkTheme, setDarkTheme] = useState(false);
  const [guesthouseUpdates, setGuesthouseUpdates] = useState(true);
  const [reviewsActivity, setReviewsActivity] = useState(true);
  const [promotions, setPromotions] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const theme = await loadTheme();
        setDarkTheme(theme === 'dark');
        const n = await loadNotifications();
        setGuesthouseUpdates(n.updates);
        setReviewsActivity(n.reviews);
        setPromotions(n.promotions);
      } catch { /* silent */ }
    })();
  }, []);

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

        <SectionTitle title="Account & Profile" />
        <View style={styles.card}>
          <Row label="Edit profile" icon="create-outline" onPress={() => router.push('/edit-profile')} />
          <Row label="Change password" icon="key-outline" onPress={() => router.push('/change-password')} />
          <Row label="Account information" icon="information-circle-outline" onPress={() => router.push('/account-info')} last />
        </View>

        <SectionTitle title="Notifications" />
        <View style={styles.card}>
          <Row label="Guesthouse updates" icon="notifications-outline" onPress={() => { setGuesthouseUpdates(v => { saveNotifications({ updates: !v, reviews: reviewsActivity, promotions: promotions }); return !v; }); }} />
          <Row label="Review or comment activity" icon="chatbubble-outline" onPress={() => { setReviewsActivity(v => { saveNotifications({ updates: guesthouseUpdates, reviews: !v, promotions: promotions }); return !v; }); }} />
          <Row label="Promotional updates" icon="megaphone-outline" onPress={() => { setPromotions(v => { saveNotifications({ updates: guesthouseUpdates, reviews: reviewsActivity, promotions: !v }); return !v; }); }} />
        </View>

        <SectionTitle title="Appearance" />
        <View style={styles.card}>
          <Row label="Light theme" icon="sunny-outline" onPress={() => { setDarkTheme(false); saveTheme('light'); }} />
          <Row label="Dark theme" icon="moon-outline" onPress={() => { const next = !darkTheme; setDarkTheme(next); saveTheme(next ? 'dark' : 'light'); }} />
        </View>

        <SectionTitle title="Privacy & Security" />
        <View style={styles.card}>
          <Row label="Privacy information" icon="shield-checkmark-outline" onPress={() => router.push('/privacy')} />
        </View>

        <SectionTitle title="Help & Support" />
        <View style={styles.card}>
          <Row label="Help and FAQs" icon="help-circle-outline" onPress={() => router.push('/help')} />
          <Row label="Contact support" icon="mail-outline" onPress={() => router.push('/support')} />
          <Row label="Report a problem" icon="flag-outline" onPress={() => router.push('/report')} />
        </View>

        <SectionTitle title="About Dumela Stays" />
        <View style={[styles.card, styles.infoCard]}>
          <View style={styles.infoIcon}><Ionicons name="leaf-outline" size={22} color={colors.dark} /></View>
          <Text style={styles.infoTitle}>Dumela Stays</Text>
          <Text style={styles.infoBody}>Guesthouse discovery for Botswana. Account recovery and push notifications are not available through the current service.</Text>
        </View>

        {user && (
          <Pressable style={[styles.logoutButton, { marginTop: 8 }]} onPress={() => { if (window.confirm ? window.confirm('Are you sure you want to log out?') : true) { doLogout(); router.replace('/'); } }}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        )}

        <Text style={styles.version}>Dumela Stays · Version 1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  backButtonSpace: { width: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 22, marginBottom: 8 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginBottom: 20 },
  infoCard: { padding: 20 },
  infoIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  infoTitle: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 6 },
  infoBody: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowValue: { fontSize: 15, fontWeight: '600', color: colors.muted },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  logoutButton: { height: 54, borderWidth: 1, borderColor: colors.danger, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.danger },
  version: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 4 },
});
