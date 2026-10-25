import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StayImage from '@/components/stay-image';
import { useAuth } from '@/data/auth';
import { useFavourites } from '@/data/favourites';

const colors = { background: '#F7F5F0', card: '#FFFFFF', dark: '#14352A', text: '#15201A', muted: '#5F6B64', border: '#E1E5E0', star: '#B7650A' };

export default function FavouritesScreen() {
  const router = useRouter();
  const { user, restoring } = useAuth();
  const { saved, favourites, loading, error, retry, toggleSaved } = useFavourites();
  const [actionError, setActionError] = useState('');
  const compare = () => {
    if (saved.length < 2) return setActionError('Save at least two stays to compare them.');
    router.push({ pathname: '/compare', params: { a: saved[0], b: saved[1] } });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={styles.subtitle}>Saved by you</Text><Text style={styles.title}>Favourites</Text></View>
          {favourites.length > 1 && <Pressable style={styles.compareButton} onPress={compare}><Ionicons name="git-compare-outline" size={18} color={colors.dark} /><Text style={styles.compareText}>Compare</Text></Pressable>}
        </View>
        {restoring ? <ActivityIndicator style={{ marginTop: 36 }} color={colors.dark} size="large" /> : null}
        {!restoring && !user ? <View style={styles.empty}><Ionicons name="heart-outline" size={38} color={colors.dark} /><Text style={styles.emptyTitle}>Your saved stays live here</Text><Text style={styles.emptyText}>Sign in to keep a list of guesthouses you love.</Text><Pressable style={styles.primary} onPress={() => router.push('/login')}><Text style={styles.primaryText}>Log in or sign up</Text></Pressable></View> : null}
        {user && loading ? <ActivityIndicator style={{ marginTop: 36 }} color={colors.dark} size="large" /> : null}
        {user && error ? <View style={styles.empty}><Text style={styles.emptyTitle}>Favourites could not load</Text><Text style={styles.emptyText}>{error}</Text><Pressable style={styles.primary} onPress={retry}><Text style={styles.primaryText}>Try again</Text></Pressable></View> : null}
        {user && !loading && !error && favourites.length === 0 ? <View style={styles.empty}><Ionicons name="heart-outline" size={38} color={colors.dark} /><Text style={styles.emptyTitle}>No favourites yet</Text><Text style={styles.emptyText}>Tap a heart on any guesthouse to save it here.</Text><Pressable style={styles.primary} onPress={() => router.push('/')}><Text style={styles.primaryText}>Explore stays</Text></Pressable></View> : null}
        {user && !error && favourites.map((stay) => <View key={stay.id} style={styles.card}>
          <Pressable style={styles.cardOpen} onPress={() => router.push({ pathname: '/details', params: { id: stay.id } })} accessibilityRole="button" accessibilityLabel={`Open ${stay.name}`}>
            <StayImage uri={stay.image} color={stay.color} style={styles.thumb} />
            <View style={styles.info}><Text style={styles.name}>{stay.name}</Text><Text style={styles.city}>{[stay.city, stay.country].filter(Boolean).join(', ')}</Text>
              <View style={styles.priceRow}>{stay.price !== undefined && <Text style={styles.price}>P{stay.price.toLocaleString('en-US')} / night</Text>}{stay.rating !== undefined && <Text style={styles.rating}>★ {stay.rating.toFixed(1)}</Text>}</View>
            </View>
          </Pressable>
          <Pressable style={styles.remove} onPress={() => void toggleSaved(stay.id).catch((reason: unknown) => setActionError(reason instanceof Error ? reason.message : 'Could not remove this favourite.'))} accessibilityRole="button" accessibilityLabel={`Remove ${stay.name} from favourites`}><Ionicons name="heart" size={21} color="#B33B37" /></Pressable>
        </View>)}
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }, subtitle: { color: colors.muted, fontSize: 14 }, title: { fontSize: 30, fontWeight: '800', color: colors.text },
  compareButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, backgroundColor: '#EEF1EC', borderRadius: 14 }, compareText: { color: colors.dark, fontWeight: '800' },
  empty: { alignItems: 'center', paddingHorizontal: 18, paddingVertical: 46, gap: 9 }, emptyTitle: { fontSize: 19, fontWeight: '800', color: colors.text, textAlign: 'center' }, emptyText: { color: colors.muted, lineHeight: 22, textAlign: 'center' },
  primary: { backgroundColor: colors.dark, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 20, marginTop: 8 }, primaryText: { color: '#FFFFFF', fontWeight: '800' },
  card: { backgroundColor: colors.card, borderRadius: 19, padding: 12, marginBottom: 14, position: 'relative' }, cardOpen: { flexDirection: 'row', gap: 13, paddingRight: 38 }, thumb: { width: 92, height: 98, borderRadius: 13 }, info: { flex: 1, justifyContent: 'center', gap: 5 }, name: { color: colors.text, fontWeight: '800', fontSize: 16 }, city: { color: colors.muted }, priceRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 5 }, price: { color: colors.text, fontWeight: '700' }, rating: { color: colors.star, fontWeight: '800' },
  remove: { position: 'absolute', top: 18, right: 17, padding: 4 }, error: { color: '#A33B32', marginTop: 12 },
});
