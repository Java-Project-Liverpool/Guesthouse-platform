import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { updateProfile, useAuth } from '@/data/auth';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function EditProfileScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { user, restoring } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (restoring) return <SafeAreaView style={styles.screen}><ActivityIndicator size="large" color={colors.primaryText} /></SafeAreaView>;

  // Only logged-in customers can edit a profile
  if (!user) return <Redirect href="/login" />;

  const initials =
    name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?';

  const save = async () => {
    if (busy) return;
    if (name.trim().length < 2) return setError('Enter a name with at least 2 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Enter a valid email address.');
    setError('');
    setBusy(true);
    try { await updateProfile({ name: name.trim(), email: email.trim() }); router.back(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save your changes.'); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit profile</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <View style={styles.photoBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {/* Photo upload needs expo-image-picker, so it is added later */}
          <Text style={styles.changePhoto}>Profile details</Text>
        </View>

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@example.com"
          placeholderTextColor={colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.primaryButton} onPress={() => void save()} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryText}>Save changes</Text>}
        </Pressable>
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

  photoBlock: { alignItems: 'center', marginBottom: 28 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: colors.primaryText },
  changePhoto: { fontSize: 15, fontWeight: '700', color: colors.primaryText },

  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
  input: {
    height: 54,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 22,
  },
  error: { fontSize: 14, color: colors.error, marginBottom: 16 },

  primaryButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
});
