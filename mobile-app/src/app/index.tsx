import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStays } from '@/data/stays';
import { useFavourites } from '@/data/favourites';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#C8CEC8',
  chip: '#EEF1EC',
  star: '#B7650A',
  heart: '#C0392B',
};

const sortOptions = [
  { key: 'cheapest', label: 'Cheapest first' },
  { key: 'rated', label: 'Top rated' },
] as const;

function formatPrice(price: number) {
  return 'P' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Photo area with the heart button (and the price pill on featured cards)
function StayPhoto({
  color,
  image,
  height,
  price,
  saved,
  onSave,
}: {
  color: string;
  image?: string;
  height: number;
  price?: number;
  saved: boolean;
  onSave: () => void;
}) {
  return (
    <View style={[styles.photo, { backgroundColor: color, height }]}>
      {image ? <Image source={{ uri: image }} style={styles.photoImage} resizeMode="cover" /> : null}
      <Pressable style={styles.heartButton} onPress={onSave}>
        <Ionicons
          name={saved ? 'heart' : 'heart-outline'}
          size={22}
          color={saved ? colors.heart : colors.dark}
        />
      </Pressable>
      {price !== undefined && (
        <View style={styles.pricePill}>
          <Text style={styles.pricePillText}>{formatPrice(price)} / night</Text>
        </View>
      )}
    </View>
  );
}

function Rating({ value }: { value: number }) {
  return (
    <View style={styles.rating}>
      <Ionicons name="star" size={16} color={colors.star} />
      <Text style={styles.ratingText}>{value.toFixed(1)}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { stays, loading, usingSample } = useStays();
  const [city, setCity] = useState('All');
  const [sort, setSort] = useState<'cheapest' | 'rated'>('cheapest');
  const [query, setQuery] = useState('');
    const { saved, toggleSaved } = useFavourites();

  const openStay = (id: string) => router.push({ pathname: '/details', params: { id } });

  const cities = ['All', ...Array.from(new Set(stays.map((stay) => stay.city)))];
  const verifiedStays = stays.filter((stay) => stay.verified);
  const featured = (verifiedStays.length > 0 ? verifiedStays : stays).slice(0, 4);

  const shown = stays
    .filter((stay) => city === 'All' || stay.city === city)
    .filter((stay) => (stay.name + ' ' + stay.city).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (sort === 'cheapest' ? a.price - b.price : (b.rating ?? 0) - (a.rating ?? 0)));

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.header, styles.padded]}>
          <View style={styles.row}>
            <View style={styles.logoTile}>
              <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
            </View>
            <View>
              <Text style={styles.greeting}>Dumela</Text>
              <Text style={styles.greetingBold}>Welcome back</Text>
            </View>
          </View>
          <Pressable style={styles.profileButton} onPress={() => router.push('/login')}>
            <Ionicons name="person-outline" size={22} color={colors.dark} />
          </Pressable>
        </View>

        <Text style={[styles.title, styles.padded]}>Where to next?</Text>

        {/* Search */}
        <View style={[styles.searchRow, styles.padded]}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={22} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or location"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
                            onFocus={() => router.push('/search')}
            />
          </View>
                    <Pressable
            style={styles.filterButton}
            onPress={() => router.push({ pathname: '/search', params: { filter: '1' } })}>
            <Ionicons name="filter-outline" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* City chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}>
          {cities.map((name) => (
            <Pressable
              key={name}
              style={[styles.chip, city === name && styles.chipActive]}
              onPress={() => setCity(name)}>
              <Text style={[styles.chipText, city === name && styles.chipTextActive]}>{name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading && <ActivityIndicator style={styles.loader} color={colors.dark} />}

        {/* Featured stays */}
        <View style={[styles.sectionHeader, styles.padded]}>
          <Text style={styles.sectionTitle}>Featured stays</Text>
          <Text style={styles.seeAll}>See all</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}>
          {featured.map((stay) => (
            <Pressable key={stay.id} style={styles.featuredCard} onPress={() => openStay(stay.id)}>
              <StayPhoto
                color={stay.color}
                image={stay.image}
                height={203}
                price={stay.price}
                saved={saved.includes(stay.id)}
                onSave={() => toggleSaved(stay.id)}
              />
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {stay.name}
                </Text>
                {stay.rating !== undefined && <Rating value={stay.rating} />}
              </View>
              <Text style={styles.cardSubtitle}>{stay.city}, Botswana</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Sort switch */}
        <View style={[styles.sortTrack, styles.padded]}>
          {sortOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[styles.sortOption, sort === option.key && styles.sortOptionActive]}
              onPress={() => setSort(option.key)}>
              <Text style={[styles.sortText, sort === option.key && styles.sortTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {usingSample && !loading && (
          <Text style={[styles.sampleNote, styles.padded]}>
            Showing sample guesthouses (backend not connected)
          </Text>
        )}

        {/* Results */}
        <View style={styles.padded}>
          {!loading && shown.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No guesthouses found</Text>
              <Text style={styles.cardSubtitle}>Try another name or location.</Text>
            </View>
          )}
          {shown.map((stay) => (
            <Pressable key={stay.id} style={styles.listCard} onPress={() => openStay(stay.id)}>
              <StayPhoto
                color={stay.color}
                image={stay.image}
                height={172}
                saved={saved.includes(stay.id)}
                onSave={() => toggleSaved(stay.id)}
              />
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {stay.name}
                </Text>
                {stay.rating !== undefined && <Rating value={stay.rating} />}
              </View>
              <View style={styles.cardTitleRow}>
                <View style={styles.row}>
                  <Ionicons name="location-outline" size={16} color={colors.muted} />
                  <Text style={styles.cardSubtitle}>{stay.city}, Botswana</Text>
                </View>
                <Text style={styles.price}>
                  {formatPrice(stay.price)} <Text style={styles.perNight}>/ night</Text>
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // On web the starter tab bar floats over the top, so leave room for it
  content: { paddingTop: Platform.OS === 'web' ? 84 : 12, paddingBottom: 40 },
  padded: { paddingHorizontal: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loader: { marginBottom: 16 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FBFCF9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  logo: { width: 38, height: 38 },
  greeting: { fontSize: 14, color: colors.muted },
  greetingBold: { fontSize: 16, fontWeight: '800', color: colors.text },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: 18 },

  // Search
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 54,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text },
  filterButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // City chips
  chipsScroll: { flexGrow: 0, marginBottom: 24 },
  chips: { paddingHorizontal: 20, gap: 10 },
  chip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.dark },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.text },
  chipTextActive: { color: '#FFFFFF' },

  // Featured
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  seeAll: { fontSize: 14, fontWeight: '700', color: colors.muted },
  featuredList: { paddingHorizontal: 20, gap: 14, marginBottom: 24 },
  featuredCard: { width: 294 },

  // Cards
  photo: { borderRadius: 20, marginBottom: 12, overflow: 'hidden' },
  photoImage: { ...StyleSheet.absoluteFill },
  heartButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricePill: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 28,
    justifyContent: 'center',
  },
  pricePillText: { fontSize: 13, fontWeight: '700', color: colors.text },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  cardSubtitle: { fontSize: 15, color: colors.muted },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 15, fontWeight: '800', color: colors.star },
  price: { fontSize: 18, fontWeight: '800', color: colors.text },
  perNight: { fontSize: 15, fontWeight: '400', color: colors.muted },

  // Sort switch
  sortTrack: {
    flexDirection: 'row',
    height: 52,
    marginHorizontal: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    backgroundColor: colors.chip,
    borderRadius: 16,
    marginBottom: 18,
  },
  sortOption: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  sortOptionActive: { backgroundColor: colors.dark },
  sortText: { fontSize: 14, fontWeight: '700', color: colors.text },
  sortTextActive: { color: '#FFFFFF' },

  // Results
  sampleNote: { fontSize: 13, color: colors.muted, marginBottom: 14 },
  listCard: { marginBottom: 24 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
});