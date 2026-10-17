import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const colors = {
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  chip: '#EEF1EC',
};

export type Filters = {
  sort: 'cheapest' | 'expensive' | 'rated';
  city: string;
  maxPrice: number | null;
  minRating: number;
  amenities: string[];
};

export const defaultFilters: Filters = {
  sort: 'cheapest',
  city: 'All',
  maxPrice: null,
  minRating: 0,
  amenities: [],
};

// How many filter groups are switched on (used for the dot on the filter button)
export function countActiveFilters(filters: Filters) {
  return (
    (filters.sort !== 'cheapest' ? 1 : 0) +
    (filters.city !== 'All' ? 1 : 0) +
    (filters.maxPrice !== null ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.amenities.length > 0 ? 1 : 0)
  );
}

const sortOptions = [
  { key: 'cheapest', label: 'Price: low to high' },
  { key: 'expensive', label: 'Price: high to low' },
  { key: 'rated', label: 'Rating' },
] as const;

const priceOptions = [
  { value: null, label: 'Any' },
  { value: 800, label: 'Under P800' },
  { value: 1000, label: 'Under P1,000' },
  { value: 1500, label: 'Under P1,500' },
];

const ratingOptions = [
  { value: 0, label: 'Any' },
  { value: 4, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
];

type Props = {
  filters: Filters;
  cities: string[];
  amenities: string[];
  onApply: (filters: Filters) => void;
  onClose: () => void;
};

// Bottom sheet with the sort and filter options. Mount it only while it is open,
// so it always starts from the current filters.
export default function FilterSheet({ filters, cities, amenities, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(filters);

  const toggleAmenity = (name: string) =>
    setDraft({
      ...draft,
      amenities: draft.amenities.includes(name)
        ? draft.amenities.filter((item) => item !== name)
        : [...draft.amenities, name],
    });

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Sort and filter</Text>
            <Pressable onPress={() => setDraft(defaultFilters)}>
              <Text style={styles.reset}>Reset</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {/* Sort by */}
            <Text style={styles.label}>Sort by</Text>
            <View style={styles.sortTrack}>
              {sortOptions.map((option) => (
                <Pressable
                  key={option.key}
                  style={[styles.sortOption, draft.sort === option.key && styles.sortOptionActive]}
                  onPress={() => setDraft({ ...draft, sort: option.key })}>
                  <Text style={[styles.sortText, draft.sort === option.key && styles.activeText]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* City */}
            <Text style={styles.label}>City</Text>
            <View style={styles.chips}>
              {['All', ...cities].map((city) => (
                <Pressable
                  key={city}
                  style={[styles.chip, draft.city === city && styles.chipActive]}
                  onPress={() => setDraft({ ...draft, city })}>
                  <Text style={[styles.chipText, draft.city === city && styles.activeText]}>{city}</Text>
                </Pressable>
              ))}
            </View>

            {/* Max price */}
            <Text style={styles.label}>Price per night</Text>
            <View style={styles.chips}>
              {priceOptions.map((option) => (
                <Pressable
                  key={option.label}
                  style={[styles.chip, draft.maxPrice === option.value && styles.chipActive]}
                  onPress={() => setDraft({ ...draft, maxPrice: option.value })}>
                  <Text style={[styles.chipText, draft.maxPrice === option.value && styles.activeText]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Minimum rating */}
            <Text style={styles.label}>Rating</Text>
            <View style={styles.chips}>
              {ratingOptions.map((option) => (
                <Pressable
                  key={option.label}
                  style={[styles.chip, draft.minRating === option.value && styles.chipActive]}
                  onPress={() => setDraft({ ...draft, minRating: option.value })}>
                  <Text style={[styles.chipText, draft.minRating === option.value && styles.activeText]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amenities */}
            {amenities.length > 0 && (
              <>
                <Text style={styles.label}>Amenities</Text>
                <View style={styles.chips}>
                  {amenities.map((name) => (
                    <Pressable
                      key={name}
                      style={[styles.chip, draft.amenities.includes(name) && styles.chipActive]}
                      onPress={() => toggleAmenity(name)}>
                      <Text style={[styles.chipText, draft.amenities.includes(name) && styles.activeText]}>
                        {name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          <Pressable style={styles.apply} onPress={() => onApply(draft)}>
            <Text style={styles.applyText}>Show results</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(21, 32, 26, 0.55)' },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    alignSelf: 'center',
    padding: 20,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  reset: { fontSize: 15, fontWeight: '800', color: colors.muted },
  body: { flexGrow: 0 },
  label: { fontSize: 16, fontWeight: '800', color: colors.muted, marginTop: 8, marginBottom: 10 },

  // Sort by
  sortTrack: {
    flexDirection: 'row',
    padding: 4,
    marginBottom: 12,
    backgroundColor: colors.chip,
    borderRadius: 16,
  },
  sortOption: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  sortOptionActive: { backgroundColor: colors.dark },
  sortText: { fontSize: 14, fontWeight: '800', color: colors.text, textAlign: 'center' },
  activeText: { color: '#FFFFFF' },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  chip: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.dark },
  chipText: { fontSize: 14, fontWeight: '800', color: colors.text },

  // Show results
  apply: {
    height: 56,
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
});