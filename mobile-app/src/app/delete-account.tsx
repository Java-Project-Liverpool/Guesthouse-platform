import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, logout as doLogout } from '@/data/auth';

const colors = { background: '#F7F5F0', card: '#FFFFFF', text: '#15201A', muted: '#5F6B64', dark: '#14352A', danger: '#B3261E', border: '#C8CEC8' };

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ padding: 8, alignSelf: 'flex-start' }}>
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </Pressable>
        <Text style={styles.title}>Delete account</Text>
        <Text style={styles.body}>Your account and saved data will be permanently removed.</Text>
        <Text style={styles.note}>This action cannot be undone. There is no dedicated account-deletion endpoint on the current backend, so deletion must be completed through support.</Text>
        <Pressable
          onPress={() => { if (typeof window !== 'undefined' && window.confirm ? window.confirm('Delete account?') : true) { doLogout(); router.replace('/'); } }}
          style={styles.dangerButton}>
          <Text style={styles.dangerText}>Confirm and delete account</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/support')} style={styles.linkButton}>
          <Text style={styles.link}>Contact support to complete deletion</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.dark, marginTop: 10, marginBottom: 12 },
  body: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 16 },
  note: { fontSize: 13, color: colors.dark, lineHeight: 20, backgroundColor: '#FFF8E7', padding: 14, borderRadius: 12, marginBottom: 20 },
  dangerButton: { minHeight: 52, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dangerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  linkButton: { marginTop: 12, alignItems: 'center', minHeight: 32, justifyContent: 'center' },
  link: { color: colors.dark, fontWeight: '700', fontSize: 14 },
});
