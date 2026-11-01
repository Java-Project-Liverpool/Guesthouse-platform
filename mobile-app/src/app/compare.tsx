import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StayImage from '@/components/stay-image';
import { MAX_COMPARE_STAYS, toggleCompareStay, useComparison } from '@/data/comparison';
import { useStays, type Stay } from '@/data/stays';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#E1E5E0',
  chip: '#EEF1EC',
  star: '#B7650A',
  accent: '#B7650A',
};

const money = (value: number) => `P${value.toLocaleString('en-US')}`;

function normaliseAmenity(name: string) {
  return name.trim().toLowerCase();
}

function allAmenities(stays: Stay[]) {
  const names = new Map<string, string>();
  stays.forEach((stay) =>
    stay.amenities.forEach((name) => {
      const key = normaliseAmenity(name);
      if (key && !names.has(key)) names.set(key, name.trim());
    })
  );
  return [...names.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, label]) => label);
}

function differs<T>(values: T[]) {
  return new Set(values.map((value) => String(value))).size > 1;
}

function bestId(stays: Stay[], pick: (stay: Stay) => number | undefined, higherIsBetter: boolean) {
  const measured = stays.filter((stay) => pick(stay) !== undefined);
  if (measured.length < 2) return null;
  const values = measured.map((stay) => pick(stay) as number);
  if (!differs(values)) return null;
  const target = higherIsBetter ? Math.max(...values) : Math.min(...values);
  return measured.find((stay) => pick(stay) === target)?.id ?? null;
}

function Row({ label, changed, children }: { label: string; changed?: boolean; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowLabel}>{label}</Text>
        {changed ? <Text style={styles.differs}>Differs</Text> : null}
      </View>
      <View style={styles.cells}>{children}</View>
    </View>
  );
}

export default function CompareScreen() {
  const router = useRouter();
  const { stays: selected, isFull, has, remove, clear } = useComparison();
  const catalogue = useStays();

  const addable = catalogue.stays.filter((stay) => !has(stay.id));
  const count = selected.length;

  const handleAdd = (stay: Stay) => {
    const result = toggleCompareStay(stay);
    if (result === 'full') {
      Alert.alert('Comparison is full', `You can compare up to ${MAX_COMPARE_STAYS} stays. Remove one first.`);
    }
  };

  const cheapestId = bestId(selected, (stay) => stay.price, false);
  const topRatedId = bestId(selected, (stay) => stay.rating, true);
  const amenities = allAmenities(selected);
  const hasMissingAmenities = selected.some((stay) => stay.amenities.length === 0);

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.headerTitle}>Compare stays</Text>
          {count > 0 ? (
            <Pressable onPress={clear} accessibilityRole="button" style={styles.clearButton}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          ) : (
            <View style={styles.iconSpacer} />
          )}
        </View>

        <Text style={styles.intro}>
          {count === 0
            ? `Choose up to ${MAX_COMPARE_STAYS} stays to compare side by side.`
            : `${count} of ${MAX_COMPARE_STAYS} stays selected.`}
        </Text>

        {/* Selected stays */}
        {count > 0 ? (
          <View style={styles.selectedRow}>
            {selected.map((stay) => (
              <View key={stay.id} style={styles.selectedColumn}>
                <Pressable onPress={() => router.push({ pathname: '/details', params: { id: stay.id } })} accessibilityRole="button" accessibilityLabel={`View ${stay.name}`}>
                  <StayImage uri={stay.image} color={stay.color} style={styles.thumb} />
                </Pressable>
                <Text style={styles.selectedName} numberOfLines={2}>{stay.name}</Text>
                <Pressable onPress={() => remove(stay.id)} accessibilityRole="button" accessibilityLabel={`Remove ${stay.name} from comparison`} style={styles.removeButton}>
                  <Ionicons name="close" size={14} color={colors.muted} />
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {/* Comparison table */}
        {count >= 2 ? (
          <View style={styles.table}>
            <Row label="Price per night" changed={differs(selected.map((stay) => stay.price ?? 'none'))}>
              {selected.map((stay) => (
                <View key={stay.id} style={styles.cell}>
                  <Text style={styles.value}>{stay.price !== undefined ? money(stay.price) : 'Not listed'}</Text>
                  {stay.id === cheapestId ? <Tag text="Cheapest" /> : null}
                </View>
              ))}
            </Row>

            <View style={styles.divider} />
            <Row label="Rating" changed={differs(selected.map((stay) => stay.rating ?? 'none'))}>
              {selected.map((stay) => (
                <View key={stay.id} style={styles.cell}>
                  {stay.rating !== undefined ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={15} color={colors.star} />
                      <Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text>
                    </View>
                  ) : (
                    <Text style={styles.muted}>No ratings yet</Text>
                  )}
                  {stay.id === topRatedId ? <Tag text="Top rated" /> : null}
                </View>
              ))}
            </Row>

            <View style={styles.divider} />
            <Row label="Reviews" changed={differs(selected.map((stay) => stay.ratings ?? 0))}>
              {selected.map((stay) => (
                <View key={stay.id} style={styles.cell}>
                  <Text style={styles.value}>{stay.ratings ? String(stay.ratings) : '0'}</Text>
                </View>
              ))}
            </Row>

            <View style={styles.divider} />
            <Row label="Location" changed={differs(selected.map((stay) => [stay.city, stay.country].filter(Boolean).join(', ')))}>
              {selected.map((stay) => (
                <View key={stay.id} style={styles.cell}>
                  <Text style={styles.body}>{[stay.city, stay.country].filter(Boolean).join(', ') || 'Not listed'}</Text>
                </View>
              ))}
            </Row>

            <View style={styles.divider} />
            <Row label="About" changed={differs(selected.map((stay) => stay.description ?? ''))}>
              {selected.map((stay) => (
                <View key={stay.id} style={styles.cell}>
                  <Text style={styles.bodySmall} numberOfLines={6}>{stay.description?.trim() || 'No description provided.'}</Text>
                </View>
              ))}
            </Row>

            <View style={styles.divider} />
            <Row label="Contact">
              {selected.map((stay) => (
                <View key={stay.id} style={styles.cell}>
                  {stay.phone || stay.email ? (
                    <>
                      {stay.phone ? <Text style={styles.bodySmall} selectable>{stay.phone}</Text> : null}
                      {stay.email ? <Text style={styles.bodySmall} selectable numberOfLines={2}>{stay.email}</Text> : null}
                    </>
                  ) : (
                    <Text style={styles.muted}>Not listed</Text>
                  )}
                </View>
              ))}
            </Row>

            {amenities.length > 0 ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>Amenities</Text>
                {amenities.map((amenity) => {
                  const key = normaliseAmenity(amenity);
                  const flags = selected.map((stay) => stay.amenities.some((name) => normaliseAmenity(name) === key));
                  return (
                    <Row key={amenity} label={amenity} changed={differs(flags)}>
                      {selected.map((stay, index) => (
                        <View key={stay.id} style={styles.cell}>
                          {stay.amenities.length === 0 ? (
                            <Text style={styles.muted}>Not listed</Text>
                          ) : flags[index] ? (
                            <Ionicons name="checkmark-circle" size={22} color={colors.dark} accessibilityLabel="Included" />
                          ) : (
                            <Ionicons name="close-circle-outline" size={22} color={colors.muted} accessibilityLabel="Not included" />
                          )}
                        </View>
                      ))}
                    </Row>
                  );
                })}
                {hasMissingAmenities ? (
                  <Text style={styles.note}>Some stays have no amenities listed, so their amenity status is unknown.</Text>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.divider} />
                <Text style={styles.note}>No amenities are listed for these stays yet.</Text>
              </>
            )}

            <View style={styles.actions}>
              {selected.map((stay) => (
                <Pressable
                  key={stay.id}
                  style={styles.actionButton}
                  onPress={() => router.push({ pathname: '/details', params: { id: stay.id } })}
                  accessibilityRole="button">
                  <Text style={styles.actionText} numberOfLines={1}>View {stay.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : count === 1 ? (
          <View style={styles.hint}>
            <Ionicons name="git-compare-outline" size={22} color={colors.dark} />
            <Text style={styles.hintText}>Select one more stay to see the comparison.</Text>
          </View>
        ) : (
          <View style={styles.hint}>
            <Ionicons name="git-compare-outline" size={22} color={colors.dark} />
            <Text style={styles.hintText}>Nothing selected yet. Pick stays below, or tap Compare on any guesthouse card.</Text>
          </View>
        )}

        {/* Add stays */}
        <Text style={styles.sectionLabel}>{isFull ? 'Comparison is full' : 'Add a stay'}</Text>
        {isFull ? (
          <Text style={styles.note}>Remove a stay to make room for another.</Text>
        ) : catalogue.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.dark} />
            <Text style={styles.muted}>Loading guesthouses…</Text>
          </View>
        ) : catalogue.error ? (
          <View style={styles.hint}>
            <Ionicons name="cloud-offline-outline" size={22} color={colors.dark} />
            <Text style={styles.hintText}>{catalogue.error}</Text>
            <Pressable style={styles.retryButton} onPress={catalogue.retry} accessibilityRole="button">
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : addable.length === 0 ? (
          <Text style={styles.note}>
            {catalogue.stays.length === 0 ? 'No guesthouses are available right now.' : 'All available guesthouses are already selected.'}
          </Text>
        ) : (
          addable.map((stay) => (
            <Pressable
              key={stay.id}
              style={({ pressed }) => [styles.candidate, pressed && styles.pressed]}
              onPress={() => handleAdd(stay)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${stay.name} to comparison`}>
              <StayImage uri={stay.image} color={stay.color} style={styles.candidateThumb} />
              <View style={styles.candidateInfo}>
                <Text style={styles.candidateName} numberOfLines={1}>{stay.name}</Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {[stay.city, stay.price !== undefined ? money(stay.price) : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <Ionicons name="add-circle-outline" size={24} color={colors.dark} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 12, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  clearButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  clearText: { fontSize: 15, fontWeight: '700', color: colors.dark },
  intro: { fontSize: 14, color: colors.muted, marginBottom: 18 },

  selectedRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  selectedColumn: { flex: 1, minWidth: 0, alignItems: 'stretch' },
  thumb: { height: 96, borderRadius: 14, overflow: 'hidden' },
  selectedName: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 8, minHeight: 36 },
  removeButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, minHeight: 32 },
  removeText: { fontSize: 13, fontWeight: '600', color: colors.muted },

  table: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 22 },
  row: { paddingVertical: 8 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  rowLabel: { fontSize: 13, fontWeight: '700', color: colors.muted },
  differs: { fontSize: 11, fontWeight: '800', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.6 },
  cells: { flexDirection: 'row', gap: 10 },
  cell: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 6 },
  value: { fontSize: 17, fontWeight: '800', color: colors.text },
  body: { fontSize: 14, lineHeight: 20, color: colors.text },
  bodySmall: { fontSize: 13, lineHeight: 18, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 17, fontWeight: '800', color: colors.star },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.dark },
  tagText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 14, marginBottom: 4 },
  note: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 8 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionButton: { flex: 1, minWidth: 0, height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.dark, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  actionText: { fontSize: 13, fontWeight: '700', color: colors.dark },

  hint: { alignItems: 'center', gap: 10, padding: 20, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginBottom: 22 },
  hintText: { fontSize: 14, lineHeight: 20, color: colors.muted, textAlign: 'center' },
  retryButton: { minHeight: 42, paddingHorizontal: 18, borderRadius: 21, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  retryText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },

  candidate: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 16, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, marginTop: 10 },
  candidateThumb: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden' },
  candidateInfo: { flex: 1, minWidth: 0, gap: 2 },
  candidateName: { fontSize: 15, fontWeight: '700', color: colors.text },
  pressed: { opacity: 0.82 },
});
