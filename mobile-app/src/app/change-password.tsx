import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/data/auth';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function ChangePasswordScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user, token, restoring } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const save = async () => {
    if (busy) return;
    if (currentPassword.length < 8) return setError('Enter your current password.');
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    setError('');
    setBusy(true);
    try {
      const response = await fetch('https://dumela-stays-api.onrender.com/api/auth/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Could not update password.');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      router.back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>Change password</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <Text style={styles.label}>Current password</Text>
        <TextInput style={styles.input} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter current password" placeholderTextColor={colors.placeholder} />

        <Text style={styles.label}>New password</Text>
        <TextInput style={styles.input} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" placeholderTextColor={colors.placeholder} />

        <Text style={styles.label}>Confirm new password</Text>
        <TextInput style={styles.input} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor={colors.placeholder} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={[styles.primaryButton, busy && styles.primaryButtonDisabled]} onPress={save} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Save</Text>}
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
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 14, marginBottom: 6 },
  input: { height: 54, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, fontSize: 16, color: colors.text },
  errorText: { color: colors.error, fontSize: 14, marginTop: 12 },
  primaryButton: { height: 54, backgroundColor: colors.primary, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});