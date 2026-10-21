import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = {
  background: '#F7F5F0',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  logoTile: '#F1F4EF',
};

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.top}>
          <View style={styles.logoTile}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
          </View>
          <Text style={styles.brand}>Dumela Stays</Text>
          <Text style={styles.title}>Discover guesthouses across Botswana</Text>
          <Text style={styles.body}>
            Search, compare prices and ratings, and save your favourites.
          </Text>
        </View>

        <View>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryText}>Start browsing</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => router.push('/login')}>
            <Text style={styles.outlineText}>Log in or sign up</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  top: { alignItems: 'flex-start' },
  logoTile: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.logoTile,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  logo: { width: 54, height: 54 },
  brand: { fontSize: 14, color: colors.muted },
  title: { fontSize: 34, fontWeight: '800', color: colors.text, marginTop: 4, marginBottom: 14 },
  body: { fontSize: 16, color: colors.muted, lineHeight: 24 },
  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  outlineButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontSize: 16, fontWeight: '700', color: colors.dark },
});