import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
};

const tabs = [
  { key: 'login', label: 'Log in' },
  { key: 'signup', label: 'Sign up' },
] as const;

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isLogin = mode === 'login';

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
              onPress={() => setMode(tab.key)}>
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
        <TextInput
          style={styles.input}
          placeholder="At least 8 characters"
          placeholderTextColor={colors.placeholder}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Main button (not connected to the backend yet) */}
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryText}>{isLogin ? 'Log in' : 'Create account'}</Text>
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
          <Pressable onPress={() => setMode('login')}>
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

  // Buttons
  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
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
});