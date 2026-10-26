import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/data/auth';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#C8CEC8',
  chip: '#EEF1EC',
};

export default function AccountInfoScreen() {
  const router = useRouter();
  const { user, restoring } = useAuth();
  const [busy, setBusy] = useState(false);

  if (restoring) return <SafeAreaView style={styles.screen}><ActivityIndicator size="large" color={colors.dark} /></SafeAreaView>;
  if (!user) return null;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.headerTitle}>Account information</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <View style={styles.card}>
          <View style={styles.iconTile}><Ionicons name="person-outline" size={24} color={colors.dark} /></View>
          <Text style={styles.fieldLabel}>Full name</Text>
          <Text style={styles.fieldValue}>{user.name}</Text>
          <Text style={styles.fieldLabel}>Email address</Text>
          <Text style={styles.fieldValue}>{user.email}</Text>
          <Text style={styles.fieldLabel}>Role</Text>
          <Text style={styles.fieldValue}>{user.role}</Text>
          <Text style={styles.fieldLabel}>Account ID</Text>
          <Text style={styles.fieldValue}>{user.id}</Text>
        </View>

        <Pressable style={[styles.refreshButton, busy && styles.refreshButtonDisabled]} onPress={() => { setBusy(true); setTimeout(() => setBusy(false), 800); }} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.dark} size={20} style={{ marginRight: 8 }} /> : <Text>Refresh</Text>}
        </Pressable>
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
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginBottom: 20 },
  iconTile: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 14 },
  fieldValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  refreshButton: { height: 54, borderWidth: 1, borderColor: colors.border, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  refreshButtonDisabled: { opacity: 0.6 },
});
