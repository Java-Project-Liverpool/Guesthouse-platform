import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login, logout, register, useAuth } from '@/data/auth';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#C8CEC8',
  placeholder: '#757575',
  tabTrack: '#EEF1EC',
  logoTile: '#F1F4EF',
  error: '#B3261E',
};

const tabs = [
  { key: 'login', label: 'Log in' },
  { key: 'signup', label: 'Sign up' },
] as const;

export default function LoginScreen() {
  const router = useRouter();
  const { user, restoring } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isLogin = mode === 'login';

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setError('');
  };

  // Checks the form, then logs in or registers through the backend
  const submit = async () => {
    if (busy) return;
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (!isLogin && !name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
      setPassword('');
      setConfirmPassword('');
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (restoring) return <SafeAreaView style={styles.screen}><ActivityIndicator size="large" color={colors.dark} /></SafeAreaView>;

  // Already signed in: show who, with a way to log out
  if (user) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.logoTile}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.brand}>Dumela Stays</Text>
          <Text style={styles.title}>You are signed in</Text>

          <View style={styles.accountCard}>
            <Text style={styles.accountName}>{user.name}</Text>
            <Text style={styles.accountEmail}>{user.email}</Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryText}>Continue browsing</Text>
          </Pressable>
          <Pressable style={styles.guestButton} onPress={() => logout()}>
            <Text style={styles.guestText}>Log out</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Logo (only on the log in view) */}
        {isLogin && (
          <View style={styles.logoTile}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          </View>
        )}

        {/* Heading */}
        <Text style={styles.brand}>Dumela Stays</Text>
        <Text style={styles.title}>{isLogin ? 'Welcome' : 'Create account'}</Text>

        {/* Log in / Sign up switch */}
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, mode === tab.key && styles.tabActive]}
              onPress={() => switchMode(tab.key)}>
              <Text style={[styles.tabText, mode === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Fields */}
        {!isLogin && (
          <>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={colors.placeholder}
              value={name}
              onChangeText={setName}
            />
          </>
        )}

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

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          <Pressable style={styles.eyeButton} onPress={() => setPasswordVisible((visible) => !visible)} accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}>
            <Ionicons name={passwordVisible ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.muted} />
          </Pressable>
        </View>
        {!isLogin && <>
          <Text style={styles.label}>Confirm password</Text>
          <TextInput style={styles.input} placeholder="Re-enter your password" placeholderTextColor={colors.placeholder} secureTextEntry={!passwordVisible} value={confirmPassword} onChangeText={setConfirmPassword} onSubmitEditing={submit} />
        </>}
        {isLogin && (
          <Pressable onPress={() => router.push('/forgot-password')}>
            <Text style={[styles.note, { marginBottom: 22 }]}>Forgot password?</Text>
          </Pressable>
        )}
        {error !== '' && <Text style={styles.error}>{error}</Text>}

        {/* Main button */}
        <Pressable
          style={[styles.primaryButton, busy && styles.primaryButtonBusy]}
          onPress={submit}
          disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>{isLogin ? 'Log in' : 'Create account'}</Text>
          )}
        </Pressable>

        {/* Log in view: guest option. Sign up view: link back to log in */}
        {isLogin ? (
          <>
            <Pressable style={styles.guestButton} onPress={() => router.replace('/')}>
              <Text style={styles.guestText}>Continue as guest</Text>
            </Pressable>
            <Text style={styles.note}>Browsing and search need no account.</Text>
          </>
        ) : (
          <Pressable onPress={() => switchMode('login')}>
            <Text style={styles.note}>Already registered? Log in</Text>
          </Pressable>
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
    paddingTop: 56,
    paddingBottom: 40,
  },

  // Logo
  logoTile: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.logoTile,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logo: { width: 42, height: 42 },

  // Heading
  brand: { fontSize: 14, color: colors.muted },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2, marginBottom: 28 },

  // Log in / Sign up switch
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.tabTrack,
    borderRadius: 14,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabActive: { backgroundColor: colors.dark },
  tabText: { fontSize: 14, fontWeight: '700', color: colors.text },
  tabTextActive: { color: '#FFFFFF' },

  // Fields
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
  passwordRow: { position: 'relative' },
  passwordInput: { paddingRight: 54 },
  eyeButton: { position: 'absolute', right: 14, top: 0, height: 54, width: 36, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 14, color: colors.error, marginTop: -8, marginBottom: 16 },

  // Buttons
  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  primaryButtonBusy: { opacity: 0.7 },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  guestButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  guestText: { fontSize: 16, fontWeight: '700', color: colors.dark },
  note: { fontSize: 14, color: colors.muted, textAlign: 'center' },

  // Signed-in view
  accountCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  accountName: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 4 },
  accountEmail: { fontSize: 14, color: colors.muted },
});
