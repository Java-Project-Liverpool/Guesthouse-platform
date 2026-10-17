import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { logout, useAuth } from '@/data/auth';
import { useFavourites } from '@/data/favourites';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#E1E5E0',
  chip: '#EEF1EC',
};

type RowProps = {
  label: string;
  value?: string | number;
  onPress: () => void;
  last?: boolean;
};

function Row({ label, value, onPress, last }: RowProps) {
  return (
    <Pressable style={[styles.row, !last && styles.rowDivider]} onPress={onPress}>
      <Text style={styles.rowText}>{label}</Text>
      <View style={styles.rowRight}>
        {value !== undefined && <Text style={styles.rowValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { saved } = useFavourites();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  // Guest view: browsing works without an account, so explain what an account adds
  if (!user) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Account</Text>

          <View style={[styles.card, styles.guestCard]}>
            <View style={styles.iconTile}>
              <Ionicons name="person-outline" size={24} color={colors.dark} />
            </View>
            <Text style={styles.cardTitle}>You are browsing as a guest</Text>
            <Text style={styles.cardBody}>
              Log in to save favourites, rate guesthouses and write reviews.
            </Text>
          </View>

          <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
            <Text style={styles.primaryText}>Log in or sign up</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const initials =
    user.name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?';

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account</Text>

        {/* Profile */}
        <View style={[styles.card, styles.profile]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        {/* Links */}
        <View style={[styles.card, styles.list]}>
          <Row label="My favourites" value={saved.length} onPress={() => router.push('/favourites')} />
          <Row label="Edit profile" onPress={() => router.push('/edit-profile')} />
          <Row label="Settings" onPress={() => router.push('/settings')} last />
        </View>

        {/* Logout */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
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
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: 24 },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    marginBottom: 20,
  },

  // Guest
  guestCard: { padding: 20 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 6 },
  cardBody: { fontSize: 15, color: colors.muted, lineHeight: 22 },

  // Profile
  profile: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: colors.dark },
  profileText: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  email: { fontSize: 14, color: colors.muted, marginTop: 2 },

  // Link rows
  list: { paddingHorizontal: 20 },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 16, fontWeight: '700', color: colors.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowValue: { fontSize: 15, fontWeight: '700', color: colors.muted },

  // Buttons
  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  logoutButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: '700', color: colors.dark },
});