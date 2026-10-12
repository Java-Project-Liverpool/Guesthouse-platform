import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Epilogue_600SemiBold, useFonts } from '@expo-google-fonts/epilogue';
const colors = {
  background: '#F7F9F4',
  card: '#FFFFFF',
  dark: '#1F3A2D',
  text: '#1B2B22',
  muted: '#5F6B63',
  soft: '#E8EAE3',
  mint: '#DDF3E4',
  whatsapp: '#25D366',
};

const tabs = [
  { key: 'phone', label: 'Mobile Phone', icon: 'call' },
  { key: 'email', label: 'Email Address', icon: 'mail-outline' },
] as const;

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
    const [fontsLoaded] = useFonts({ Epilogue_600SemiBold });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={styles.screen}>
      {/* Top bar */}
      <View style={styles.header}>
        <View style={styles.row}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.dark} />
          </Pressable>
                    <Image source={require('@/assets/images/logo.png')} style={styles.smallLogo} />
          <Text style={styles.headerTitle}>Dumela Stays</Text>
        </View>
        <View style={styles.row}>
          <Ionicons name="globe-outline" size={20} color={colors.dark} />
          <Text style={styles.language}>EN</Text>
          <View style={styles.profileButton}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
                {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.logo}>
                        <Image source={require('@/assets/images/logo.png')} style={styles.logoImage} />
            <View style={styles.compassBadge}>
              <Ionicons name="compass-outline" size={14} color={colors.dark} />
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.brandName}>Dumela Stays</Text>
            <Text style={styles.countryPill}>Botswana</Text>
          </View>
          <Text style={styles.tagline}>DISCOVER AUTHENTIC BOTSWANA HOSPITALITY</Text>
        </View>

        {/* Welcome card */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome back, Traveler</Text>
          <Text style={styles.welcomeText}>
            Sign in to access your saved safari sanctuaries, direct host notes, and curated
            regional reflections.
          </Text>
        </View>
                {/* Phone / Email switch */}
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, mode === tab.key && styles.tabActive]}
              onPress={() => setMode(tab.key)}>
              <Ionicons name={tab.icon} size={16} color={colors.text} />
              <Text style={styles.tabText}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Phone or email field */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {mode === 'phone' ? 'Botswana Mobile Number' : 'Email Address'}
          </Text>
          {mode === 'phone' && <Text style={styles.labelLink}>Direct OTP & WhatsApp</Text>}
        </View>
        <View style={styles.input}>
          {mode === 'phone' ? (
            <>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>🇧🇼 +267</Text>
                <Ionicons name="chevron-down" size={12} color={colors.muted} />
              </View>
              <TextInput
                style={styles.inputText}
                placeholder="71 234 567"
                placeholderTextColor="#9AA39C"
                keyboardType="phone-pad"
              />
            </>
          ) : (
            <TextInput
              style={styles.inputText}
              placeholder="you@example.com"
              placeholderTextColor="#9AA39C"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        </View>

        {/* Password field */}
        <View style={styles.labelRow}>
          <Text style={styles.label}>Passcode / Password</Text>
          <Text style={styles.forgot}>Forgot?</Text>
        </View>
        <View style={styles.input}>
          <Ionicons name="key-outline" size={20} color={colors.muted} />
          <TextInput
            style={styles.inputText}
            placeholder="Enter your security passcode"
            placeholderTextColor="#9AA39C"
            secureTextEntry={!showPassword}
          />
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.text}
            />
          </Pressable>
        </View>
                {/* Remember me */}
        <View style={styles.rememberRow}>
          <Pressable style={styles.row} onPress={() => setRemember(!remember)}>
            <View style={[styles.checkbox, !remember && styles.checkboxEmpty]}>
              {remember && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            <Text style={styles.rememberText}>Remember on this device</Text>
          </Pressable>
          <View style={styles.encrypted}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.muted} />
            <Text style={styles.encryptedText}>Encrypted</Text>
          </View>
        </View>

        {/* Sign in */}
        <Pressable style={styles.signIn}>
          <Text style={styles.signInText}>Sign In</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
                {/* Other ways to sign in */}
        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OR EXPLORE WITH</Text>
          <View style={styles.line} />
        </View>

        <Pressable style={styles.whatsapp}>
          <View style={styles.whatsappIcon}>
            <Ionicons name="chatbox" size={18} color="#fff" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.whatsappTitle}>Sign in via WhatsApp Code</Text>
            <Text style={styles.whatsappText}>Instant code sent to your phone</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>

        <View style={styles.socialRow}>
          <Pressable style={styles.social}>
            <Ionicons name="logo-google" size={16} color="#4285F4" />
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
          <Pressable style={styles.social}>
            <Ionicons name="logo-apple" size={18} color="#000" />
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
        </View>
                {/* Guest and create account */}
        <Pressable style={styles.guest} onPress={() => router.replace('/')}>
          <Ionicons name="search-circle-outline" size={22} color={colors.text} />
          <Text style={styles.guestText}>Continue as Guest</Text>
          <Text style={styles.guestHint}>(Browse stays directly)</Text>
        </Pressable>

        <Text style={styles.createRow}>
          New to Dumela Stays? <Text style={styles.createLink}>Create an account</Text>
        </Text>

        {/* Footer note */}
        <View style={styles.note}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.dark} />
          <View style={styles.flex}>
            <Text style={styles.noteTitle}>Zero-Commission Direct Discovery Platform</Text>
            <Text style={styles.noteText}>
              Connect directly with verified Botswana hosts via WhatsApp, call, or email. Dumela
              Stays never marks up rates or holds booking fees.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Top bar
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FBFCF9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
    smallLogo: {
        width: 36,
        height: 36,
        borderRadius: 6,
     },

    headerTitle: {
      fontSize: 20,
      fontFamily: 'Epilogue_600SemiBold',
      color: colors.dark,
    },

  language: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.dark,
    marginRight: 6,
},
  
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: 16, paddingBottom: 32 },
  
  // Brand
  brand: { alignItems: 'center', marginTop: 8, marginBottom: 16, gap: 8 },
   logo: { width: 80,height: 80 },
  logoImage: { width: 80, height: 80 },
  compassBadge: {
    position: 'absolute',
    right: -12,
    bottom: -8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
    brandName: { fontSize: 20, fontFamily: 'Epilogue_600SemiBold', color: colors.dark },
  countryPill: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.dark,
    backgroundColor: colors.mint,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tagline: { fontSize: 12, letterSpacing: 1, color: colors.muted },

  // Welcome card
  welcomeCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 20 },
    welcomeTitle: {
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.26,
    fontFamily: 'Epilogue_600SemiBold',
    color: '#191C1A',
    marginBottom: 8,
  },
  welcomeText: { fontSize: 16, lineHeight: 24, color: colors.muted },
  
  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.soft,
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 20,
  },
  tabActive: { backgroundColor: colors.card },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.text },

  // Inputs
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  label: { fontSize: 13, color: colors.muted },
  labelLink: { fontSize: 11, fontWeight: '700', color: '#3F7A55' },
  forgot: { fontSize: 13, fontWeight: '700', color: colors.dark },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 16,
  },
  inputText: { flex: 1, fontSize: 15, color: colors.text },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.soft,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  countryCodeText: { fontSize: 14, fontWeight: '700', color: colors.text },
  
  // Remember me
  rememberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxEmpty: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.muted },
  rememberText: { fontSize: 13, color: colors.muted },
  encrypted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.soft,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  encryptedText: { fontSize: 11, fontWeight: '600', color: colors.muted },

  // Sign in
  signIn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.dark,
    borderRadius: 18,
    height: 56,
  },
  signInText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  
  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: colors.soft },
  dividerText: { fontSize: 10, letterSpacing: 1, color: colors.muted },

  // WhatsApp
  whatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.mint,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  whatsappIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  whatsappText: { fontSize: 12, color: colors.muted },

  // Google / Apple
  socialRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  social: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    height: 44,
  },
  socialText: { fontSize: 14, fontWeight: '600', color: colors.text },
  
  // Guest + create account
  guest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.soft,
    borderRadius: 22,
    height: 46,
    marginBottom: 20,
  },
  guestText: { fontSize: 15, fontWeight: '700', color: colors.text },
  guestHint: { fontSize: 11, color: colors.muted },
  createRow: { textAlign: 'center', fontSize: 15, color: colors.muted, marginBottom: 20 },
  createLink: { fontWeight: '700', color: colors.text },

  // Footer note
  note: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F0F1EB',
    borderRadius: 14,
    padding: 12,
  },
  noteTitle: { fontSize: 12, fontWeight: '700', color: colors.text, marginBottom: 2 },
  noteText: { fontSize: 12, lineHeight: 17, color: colors.muted },
});
