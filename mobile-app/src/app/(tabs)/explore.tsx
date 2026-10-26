import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import FilterSheet, { countActiveFilters, defaultFilters, type Filters } from '@/components/filter-sheet';
import GuesthouseCard from '@/components/guesthouse-card';
import LoginPrompt from '@/components/login-prompt';
import { Colors, Radii, Spacing, TabBarHeight, Typography } from '@/constants/theme';
import { useAuth } from '@/data/auth';
import { useFavourites } from '@/data/favourites';
import { useStays } from '@/data/stays';

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { q, city: cityParam, filter } = useLocalSearchParams<{ q?: string; city?: string; filter?: string }>();
  const queryParam = typeof q === 'string' ? q : undefined;
  const selectedCityParam = typeof cityParam === 'string' ? cityParam.trim() : undefined;
  const { stays, loading, error, retry } = useStays();
  const { user } = useAuth();
  const { saved, toggleSaved } = useFavourites();
  const [queryOverride, setQueryOverride] = useState<{ source: string | undefined; value: string } | null>(null);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [cityOverride, setCityOverride] = useState<{ source: string | undefined; value: string } | null>(null);
  const [sheetOverride, setSheetOverride] = useState<{ source: string | undefined; open: boolean } | null>(null);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const query = queryOverride && queryOverride.source === queryParam ? queryOverride.value : queryParam ?? '';
  const selectedCity = cityOverride && cityOverride.source === selectedCityParam ? cityOverride.value : selectedCityParam ?? 'All';
  const effectiveFilters = useMemo(() => ({ ...filters, city: selectedCity }), [filters, selectedCity]);
  const sheetOpen = sheetOverride && sheetOverride.source === filter ? sheetOverride.open : filter === '1';
  const activeFilters = countActiveFilters(effectiveFilters);
  const setSheetOpen = (open: boolean) => setSheetOverride({ source: filter, open });

  const cities = useMemo(
    () => [...new Set(stays.map((stay) => stay.city.trim()).filter(Boolean))],
    [stays]
  );
  const filterCities = useMemo(
    () => selectedCity !== 'All' && !cities.includes(selectedCity) ? [...cities, selectedCity] : cities,
    [cities, selectedCity]
  );
  const amenities = useMemo(
    () => [...new Set(stays.flatMap((stay) => stay.amenities))].sort(),
    [stays]
  );

  const results = useMemo(() => {
    const searchText = query.trim().toLocaleLowerCase();
    return stays
      .filter((stay) => {
        const searchable = [stay.name, stay.city, stay.country, stay.description]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase();
        return !searchText || searchable.includes(searchText);
      })
      .filter((stay) => effectiveFilters.city === 'All' || stay.city === effectiveFilters.city)
      .filter((stay) => effectiveFilters.maxPrice === null || (stay.price !== undefined && stay.price <= effectiveFilters.maxPrice))
      .filter((stay) => effectiveFilters.minRating === 0 || (stay.rating !== undefined && stay.rating >= effectiveFilters.minRating))
      .filter((stay) => effectiveFilters.amenities.every((amenity) => stay.amenities.includes(amenity)))
      .sort((a, b) => {
        if (effectiveFilters.sort === 'cheapest') return (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY);
        if (effectiveFilters.sort === 'expensive') return (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY);
        return (b.rating ?? Number.NEGATIVE_INFINITY) - (a.rating ?? Number.NEGATIVE_INFINITY);
      });
  }, [effectiveFilters, query, stays]);

  const clearFilters = () => {
    setQueryOverride({ source: queryParam, value: '' });
    setFilters(defaultFilters);
    setCityOverride({ source: selectedCityParam, value: 'All' });
  };

  const saveStay = async (id: string) => {
    if (!user) {
      setLoginPromptOpen(true);
      return;
    }
    try {
      const stay = stays.find((item) => item.id === id);
      await toggleSaved(id, stay);
      setActionError('');
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Could not update favourites.');
    }
  };

  const clearCity = () => {
    setCityOverride({ source: selectedCityParam, value: 'All' });
    setFilters((current) => ({ ...current, city: 'All' }));
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + TabBarHeight + Spacing.five },
        ]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>DUMELA STAYS</Text>
            <Text style={styles.title}>Explore stays</Text>
            <Text style={styles.subtitle}>Find a guesthouse that suits your journey.</Text>
          </View>
          <Pressable
            onPress={() => router.push('/account')}
            accessibilityRole="button"
            accessibilityLabel="Open account"
            style={({ pressed }) => [styles.accountButton, pressed && styles.pressed]}>
            <Ionicons name="person-outline" size={19} color={Colors.light.primary} />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Ionicons name="search-outline" size={20} color={Colors.light.textSecondary} />
            <TextInput
              value={query}
              onChangeText={(value) => setQueryOverride({ source: queryParam, value })}
              placeholder="Name, city or location"
              placeholderTextColor={Colors.light.textSecondary}
              accessibilityLabel="Search guesthouses by name or location"
              returnKeyType="search"
              style={styles.searchInput}
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQueryOverride({ source: queryParam, value: '' })} accessibilityRole="button" accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={19} color={Colors.light.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={activeFilters ? `Filters, ${activeFilters} applied` : 'Open filters'}
            style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}>
            <Ionicons name="options-outline" size={20} color="#FFFFFF" />
            {activeFilters > 0 ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        {selectedCity !== 'All' || activeFilters > 0 ? (
          <View style={styles.activeFilterRow}>
            {selectedCity !== 'All' ? (
              <Pressable onPress={clearCity} style={styles.activeChip} accessibilityRole="button" accessibilityLabel={`Remove ${selectedCity} filter`}>
                <Text style={styles.activeChipText}>{selectedCity}</Text>
                <Ionicons name="close" size={14} color={Colors.light.primary} />
              </Pressable>
            ) : null}
            {activeFilters > 0 ? (
              <Pressable onPress={clearFilters} accessibilityRole="button" hitSlop={8}>
                <Text style={styles.clearText}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.resultsHeading}>
          <Text style={styles.resultsTitle}>{loading ? 'Finding stays' : `${results.length} ${results.length === 1 ? 'stay' : 'stays'}`}</Text>
          {activeFilters > 0 ? <Text style={styles.resultsContext}>Filters applied</Text> : <Text style={styles.resultsContext}>Across Botswana</Text>}
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={Colors.light.primary} />
            <Text style={styles.stateCopy}>Loading guesthouses from the live directory…</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={27} color={Colors.light.primary} />
            <Text style={styles.stateTitle}>We couldn’t load guesthouses</Text>
            <Text style={styles.stateCopy}>{error}</Text>
            <Pressable onPress={retry} style={styles.primaryButton} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && results.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="search-outline" size={24} color={Colors.light.primary} />
            </View>
            <Text style={styles.stateTitle}>{stays.length === 0 ? 'No stays listed yet' : 'No matching stays'}</Text>
            <Text style={styles.stateCopy}>
              {stays.length === 0
                ? 'Guesthouse listings will appear here as they join Dumela Stays.'
                : 'Try another search or clear your filters to see more places.'}
            </Text>
            {stays.length > 0 ? (
              <Pressable onPress={clearFilters} style={styles.primaryButton} accessibilityRole="button">
                <Text style={styles.primaryButtonText}>Clear search and filters</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {!loading && !error ? results.map((stay) => (
          <GuesthouseCard
            key={stay.id}
            stay={stay}
            saved={saved.includes(stay.id)}
            onPress={() => router.push({ pathname: '/details', params: { id: stay.id } })}
            onToggleSaved={() => void saveStay(stay.id)}
          />
        )) : null}
        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
      </ScrollView>

      {sheetOpen ? (
        <FilterSheet
          filters={effectiveFilters}
          cities={filterCities}
          amenities={amenities}
          onApply={(next) => {
            setFilters(next);
            setCityOverride({ source: selectedCityParam, value: next.city });
            setSheetOpen(false);
          }}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
      <LoginPrompt visible={loginPromptOpen} onClose={() => setLoginPromptOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  eyebrow: { ...Typography.metadata, letterSpacing: 1.4, color: Colors.light.textSecondary },
  title: { ...Typography.screenTitle, color: Colors.light.text, marginTop: 3 },
  subtitle: { ...Typography.supporting, color: Colors.light.textSecondary, marginTop: 3 },
  accountButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: Colors.light.border, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchField: { minHeight: 52, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: Radii.control, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.light.border },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 10, color: Colors.light.text, ...Typography.body },
  filterButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: Radii.control, backgroundColor: Colors.light.primary },
  filterDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: '#DFA36F' },
  activeFilterRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  activeChip: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderRadius: Radii.pill, backgroundColor: '#E6ECE5' },
  activeChipText: { ...Typography.metadata, color: Colors.light.primary },
  clearText: { ...Typography.metadata, color: Colors.light.textSecondary, textDecorationLine: 'underline' },
  resultsHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 25, marginBottom: 14 },
  resultsTitle: { ...Typography.section, color: Colors.light.text },
  resultsContext: { ...Typography.metadata, color: Colors.light.textSecondary },
  loadingState: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 12 },
  stateCard: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 36, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.light.border },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EFE8', marginBottom: 12 },
  stateTitle: { ...Typography.cardTitle, textAlign: 'center', color: Colors.light.text },
  stateCopy: { ...Typography.supporting, textAlign: 'center', color: Colors.light.textSecondary, marginTop: 7 },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 17, borderRadius: Radii.pill, backgroundColor: Colors.light.primary },
  primaryButtonText: { ...Typography.supporting, fontWeight: '600', color: '#FFFFFF' },
  actionError: { ...Typography.supporting, color: '#A13E37', marginTop: 8 },
  pressed: { opacity: 0.82 },
});
