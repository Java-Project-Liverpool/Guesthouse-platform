import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, logout as doLogout } from '@/data/auth';
import { apiRequest } from '@/data/api';

const colors = { background: '#F7F5F0', card: '#FFFFFF', text: '#15201A', muted: '#5F6B64', dark: '#14352A', danger: '#B3261E', border: '#C8CEC8', accent: '#B7650A' };

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!token) { setError('Sign in to delete your account.'); return; }
    if (password.length < 8) { setError('Enter your current password to confirm.'); return; }
    setBusy(true); setError('');
    try {
      await apiRequest('/api/auth/delete-account', { method: 'DELETE', token });
      setBusy(false);
      doLogout();
      router.replace('/');
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Deletion failed. Try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={{ padding: 8, alignSelf: 'flex-start' }}>
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </Pressable>
        <Text style={styles.title}>Delete account</Text>
        <Text style={styles.body}>This permanently removes your profile, favourites, reviews, and notifications.</Text>
        <Text style={styles.note}>Confirm with your current password to proceed.</Text>
        <View style={styles.inputCard}>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Current password"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCapitalize="none"
            accessibilityLabel="Current password"
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.dangerButton, busy && { opacity: 0.7 }]}
          onPress={() => { if (!busy) submit(); }}
          accessibilityRole="button"
          accessibilityState={{ busy }}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.dangerText}>Confirm and delete account</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.dark, marginTop: 10, marginBottom: 12 },
  body: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 16 },
  note: { fontSize: 13, color: colors.dark, lineHeight: 20, backgroundColor: '#FFF8E7', padding: 14, borderRadius: 12, marginBottom: 20 },
  inputCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16 },
  input: { fontSize: 15, color: colors.text, minHeight: 36 },
  error: { fontSize: 13, color: colors.danger, marginBottom: 10 },
  dangerButton: { minHeight: 52, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dangerText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
