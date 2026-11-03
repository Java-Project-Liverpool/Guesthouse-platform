import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/data/auth';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function AccountInfoScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user, restoring } = useAuth();
  const [busy, setBusy] = useState(false);

  const refreshAccount = async () => {
    setBusy(true);
    try {
      const sessionStr = await import('expo-secure-store').then(m => m.getItemAsync('dumela-auth-session'));
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (parsed?.token) {
          const { apiRequest } = await import('@/data/api');
          await apiRequest<{ user: { id?: string; name: string; email: string; role: string } }>(`/api/auth/me`, { token: parsed.token });
        }
      }
    } catch {
      // silent
    } finally {
      setTimeout(() => setBusy(false), 800);
    }
  };

  if (restoring) return <SafeAreaView style={styles.screen}><ActivityIndicator size="large" color={colors.primaryText} /></SafeAreaView>;
  if (!user) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>Account information</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <View style={styles.card}>
          <View style={styles.iconTile}><Ionicons name="person-outline" size={24} color={colors.primaryText} /></View>
          <Text style={styles.fieldLabel}>Full name</Text>
          <Text style={styles.fieldValue}>{user.name}</Text>
          <Text style={styles.fieldLabel}>Email address</Text>
          <Text style={styles.fieldValue}>{user.email}</Text>
          <Text style={styles.fieldLabel}>Role</Text>
          <Text style={styles.fieldValue}>{user.role}</Text>
          <Text style={styles.fieldLabel}>Account ID</Text>
          <Text style={styles.fieldValue}>{user.id}</Text>
        </View>

        <Pressable style={[styles.refreshButton, busy && styles.refreshButtonDisabled]} onPress={refreshAccount} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.primaryText} size={20} style={{ marginRight: 8 }} /> : <Text>Refresh</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  backButtonSpace: { width: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginBottom: 20 },
  iconTile: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: 14 },
  fieldValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  refreshButton: { height: 54, borderWidth: 1, borderColor: colors.border, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  refreshButtonDisabled: { opacity: 0.6 },
});
