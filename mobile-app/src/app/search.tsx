import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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

import FilterSheet, { countActiveFilters, defaultFilters, type Filters } from '@/components/filter-sheet';
import { useStays } from '@/data/stays';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#C8CEC8',
  cardBorder: '#E1E5E0',
  chip: '#EEF1EC',
  star: '#B7650A',
  badge: '#C9822B',
};

const sortOptions = [
  { key: 'cheapest', label: 'Cheapest first' },
  { key: 'rated', label: 'Top rated' },
] as const;

function formatPrice(price: number) {
  return 'P' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function SearchScreen() {
  const router = useRouter();
  const { q, filter } = useLocalSearchParams<{ q?: string; filter?: string }>();
  const { stays, loading } = useStays();
  const [query, setQuery] = useState(q ?? '');
  const [showResults, setShowResults] = useState(Boolean(q) || filter === '1');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sheetOpen, setSheetOpen] = useState(filter === '1');
  // Recent searches are kept in memory only, so they reset when the app restarts
  const [recent, setRecent] = useState(['Maun', 'Kasane lodge', 'Gaborone']);

  const cities = Array.from(new Set(stays.map((stay) => stay.city)));
  const amenityOptions = Array.from(new Set(stays.flatMap((stay) => stay.amenities)));
  const text = query.trim().toLowerCase();
  const activeFilters = countActiveFilters(filters);

  const search = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    setQuery(clean);
    setShowResults(true);
    setRecent((current) =>
      [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 5)
    );
  };

  const clearSearch = () => {
    setQuery('');
    setFilters(defaultFilters);
    setShowResults(false);
  };

  const results = stays
    .filter((stay) => (stay.name + ' ' + stay.city).toLowerCase().includes(text))
    .filter((stay) => filters.city === 'All' || stay.city === filters.city)
    .filter((stay) => filters.maxPrice === null || stay.price <= filters.maxPrice)
    .filter((stay) => (stay.rating ?? 0) >= filters.minRating)
    .filter((stay) => filters.amenities.every((name) => stay.amenities.includes(name)))
    .sort((a, b) => {
      if (filters.sort === 'cheapest') return a.price - b.price;
      if (filters.sort === 'expensive') return b.price - a.price;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

  const isCity = cities.some((city) => city.toLowerCase() === text);
  const place =
    text === ''
      ? filters.city !== 'All'
        ? ' in ' + filters.city
        : ''
      : isCity
        ? ' in ' + query.trim()
        : ' for "' + query.trim() + '"';
  const countText = results.length + (results.length === 1 ? ' guesthouse' : ' guesthouses') + place;

  // Back arrow: leave the screen, or return to the search view if we typed the search here
  const goBack = () => (q || filter ? router.back() : setShowResults(false));

  // Search view: recent searches and popular cities
  if (!showResults) {
    return (
      <SafeAreaView style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={22} color={colors.text} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or location"
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => search(query)}
                returnKeyType="search"
                autoFocus
              />
            </View>
            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>

          {recent.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent searches</Text>
                <Pressable onPress={() => setRecent([])}>
                  <Text style={styles.clear}>Clear</Text>
                </Pressable>
              </View>
              {recent.map((item) => (
                <View key={item} style={styles.recentRow}>
                  <Pressable style={styles.recentMain} onPress={() => search(item)}>
                    <Ionicons name="time-outline" size={22} color={colors.text} />
                    <Text style={styles.recentText}>{item}</Text>
                  </Pressable>
                  <Pressable onPress={() => setRecent(recent.filter((other) => other !== item))}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </Pressable>
                </View>
              ))}
            </>
          )}

          <Text style={[styles.sectionTitle, styles.popularTitle]}>Popular cities</Text>
          <View style={styles.cityChips}>
            {cities.map((city) => (
              <Pressable key={city} style={styles.cityChip} onPress={() => search(city)}>
                <Ionicons name="location-outline" size={16} color={colors.text} />
                <Text style={styles.cityChipText}>{city}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Results view
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.resultsHeader}>
          <Pressable style={styles.backButton} onPress={goBack}>
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.resultsTitle}>Results</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={22} color={colors.text} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or location"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
          <Pressable style={styles.filterButton} onPress={() => setSheetOpen(true)}>
            <Ionicons name="filter-outline" size={22} color="#FFFFFF" />
            {activeFilters > 0 && <View style={styles.filterDot} />}
          </Pressable>
        </View>

        <View style={styles.sortTrack}>
          {sortOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[styles.sortOption, filters.sort === option.key && styles.sortOptionActive]}
              onPress={() => setFilters({ ...filters, sort: option.key })}>
              <Text style={[styles.sortText, filters.sort === option.key && styles.sortTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading && <ActivityIndicator color={colors.dark} />}

        {!loading && results.length > 0 && <Text style={styles.count}>{countText}</Text>}

        {!loading && results.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No guesthouses found</Text>
            <Text style={styles.emptyText}>Try another name or location.</Text>
            <Pressable style={styles.clearButton} onPress={clearSearch}>
              <Text style={styles.clearButtonText}>Clear search</Text>
            </Pressable>
          </View>
        )}

        {results.map((stay) => (
          <Pressable
            key={stay.id}
            style={styles.resultCard}
            onPress={() => router.push({ pathname: '/details', params: { id: stay.id } })}>
            <View style={[styles.thumb, { backgroundColor: stay.color }]}>
              {stay.image ? (
                <Image source={{ uri: stay.image }} style={styles.thumbImage} resizeMode="cover" />
              ) : null}
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultName} numberOfLines={2}>
                {stay.name}
              </Text>
              <Text style={styles.resultCity}>{stay.city}, Botswana</Text>
              <View style={styles.priceRow}>
                <Text style={styles.resultPrice}>{formatPrice(stay.price)}</Text>
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

      {sheetOpen && (
        <FilterSheet
          filters={filters}
          cities={cities}
          amenities={amenityOptions}
          onApply={(next) => {
            setFilters(next);
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
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

  // Search box (used in both views)
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
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
  cancel: { fontSize: 16, fontWeight: '800', color: colors.text },
  filterButton: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.badge,
  },

  // Search view
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  clear: { fontSize: 14, fontWeight: '700', color: colors.muted },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  recentMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, height: 56 },
  recentText: { fontSize: 16, color: colors.text },
  popularTitle: { marginTop: 24, marginBottom: 12 },
  cityChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.chip,
  },
  cityChipText: { fontSize: 14, fontWeight: '700', color: colors.text },

  // Results view
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  resultsTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  sortTrack: {
    flexDirection: 'row',
    height: 52,
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
  count: { fontSize: 14, color: colors.muted, marginBottom: 14 },

  // Result cards
  resultCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    marginBottom: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
  },
  thumb: { width: 100, height: 100, borderRadius: 14, overflow: 'hidden' },
  thumbImage: { ...StyleSheet.absoluteFill },
  resultInfo: { flex: 1, justifyContent: 'center' },
  resultName: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 2 },
  resultCity: { fontSize: 14, color: colors.muted, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultPrice: { fontSize: 17, fontWeight: '800', color: colors.text },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '800', color: colors.star },

  // No results
  empty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { fontSize: 15, color: colors.muted },
  clearButton: {
    height: 48,
    paddingHorizontal: 28,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: { fontSize: 15, fontWeight: '700', color: colors.dark },
});