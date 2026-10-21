import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const send = () => {
    if (!email.includes('@')) return setError('Enter a valid email address.');
    setError('');
    // Placeholder: call the backend reset route here once it exists
    setSent(true);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.dark} />
        </Pressable>

        <Text style={styles.brand}>Account help</Text>
        <Text style={styles.title}>Forgot password?</Text>

        {sent ? (
          <>
            <Text style={styles.body}>
              If an account exists for {email.trim()}, we have sent a link to reset your password.
            </Text>
            <Pressable style={styles.primaryButton} onPress={() => router.replace('/login')}>
              <Text style={styles.primaryText}>Back to log in</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.body}>
              Enter your email and we will send you a link to reset your password.
            </Text>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            {error !== '' && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.primaryButton} onPress={send}>
              <Text style={styles.primaryText}>Send reset link</Text>
            </Pressable>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.note}>Back to log in</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  brand: { fontSize: 14, color: colors.muted },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2, marginBottom: 12 },
  body: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 8 },
  input: {
    height: 54,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 22,
  },
  error: { fontSize: 14, color: colors.danger, marginBottom: 16 },
  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  note: { fontSize: 14, color: colors.muted, textAlign: 'center' },
});