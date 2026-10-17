import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFavourites } from '@/data/favourites';
import { useStays } from '@/data/stays';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  cardBorder: '#E1E5E0',
  chip: '#EEF1EC',
  star: '#B7650A',
};

function formatPrice(price: number) {
  return 'P' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function FavouritesScreen() {
  const router = useRouter();
  const { stays } = useStays();
  const { saved } = useFavourites();

  const favourites = stays.filter((stay) => saved.includes(stay.id));

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Saved by you</Text>
            <Text style={styles.title}>Favourites</Text>
          </View>
          {favourites.length > 0 && (
            <Pressable style={styles.compareButton}>
              <Ionicons name="filter-outline" size={18} color={colors.dark} />
              <Text style={styles.compareText}>Compare</Text>
            </Pressable>
          )}
        </View>

        {/* Empty state */}
        {favourites.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyCircle}>
              <Ionicons name="heart-outline" size={36} color={colors.dark} />
            </View>
            <Text style={styles.emptyTitle}>No favourites yet</Text>
            <Text style={styles.emptyText}>Tap the heart on a stay to save it here.</Text>
            <Pressable style={styles.browseButton} onPress={() => router.push('/')}>
              <Text style={styles.browseText}>Browse stays</Text>
            </Pressable>
          </View>
        )}

        {/* Saved stays */}
        {favourites.map((stay) => (
          <Pressable
            key={stay.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/details', params: { id: stay.id } })}>
            <View style={[styles.thumb, { backgroundColor: stay.color }]}>
              {stay.image ? (
                <Image source={{ uri: stay.image }} style={styles.thumbImage} resizeMode="cover" />
              ) : null}
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {stay.name}
              </Text>
              <Text style={styles.city}>{stay.city}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{formatPrice(stay.price)}</Text>
                {stay.rating !== undefined && (
                  <View style={styles.rating}>
                    <Ionicons name="star" size={14} color={colors.star} />
                    <Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // On web the starter tab bar floats over the top, so leave room for it
  content: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 84 : 16,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  subtitle: { fontSize: 14, color: colors.muted },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 14,
  },
  compareText: { fontSize: 15, fontWeight: '800', color: colors.dark },

  // Saved stays
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 10,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
  },
  thumb: { width: 90, height: 90, borderRadius: 14, overflow: 'hidden' },
  thumbImage: { ...StyleSheet.absoluteFill },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 2 },
  city: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: 16, fontWeight: '800', color: colors.text },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '800', color: colors.star },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 70, gap: 6 },
  emptyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  browseButton: {
    height: 52,
    paddingHorizontal: 28,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
});