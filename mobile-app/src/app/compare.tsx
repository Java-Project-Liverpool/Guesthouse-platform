import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStays } from '@/data/stays';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#E1E5E0',
  chip: '#EEF1EC',
  star: '#B7650A',
};

const amenityRows = ['Wi-Fi', 'Pool', 'Breakfast', 'Parking'];

function formatPrice(price: number) {
  return 'P' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Matches the design's amenity names against whatever names the stay uses
function has(amenities: string[], row: string) {
  const key = row.toLowerCase().replace('-', '').slice(0, 4);
  return amenities.some((name) => name.toLowerCase().replace('-', '').includes(key));
}

export default function CompareScreen() {
  const router = useRouter();
  const { a, b } = useLocalSearchParams<{ a?: string; b?: string }>();
  const { stays } = useStays();

  const first = stays.find((item) => item.id === a);
  const second = stays.find((item) => item.id === b);
  if (!first || !second) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.missing}>
          <Text style={styles.missingText}>Choose two stays to compare.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryText}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const pair = [first, second];
  const cheapest = first.price <= second.price ? first.id : second.id;
  const topRated = (first.rating ?? 0) >= (second.rating ?? 0) ? first.id : second.id;

  const openStay = (id: string) => router.push({ pathname: '/details', params: { id } });

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.headerTitle}>Compare stays</Text>
          <View style={styles.backButtonSpace} />
        </View>

        {/* Photos and names */}
        <View style={styles.columns}>
          {pair.map((stay) => (
            <View key={stay.id} style={styles.column}>
              <View style={[styles.photo, { backgroundColor: stay.color }]}>
                {stay.image ? (
                  <Image source={{ uri: stay.image }} style={styles.photoImage} resizeMode="cover" />
                ) : null}
              </View>
              <Text style={styles.name}>{stay.name}</Text>
            </View>
          ))}
        </View>

        {/* Comparison table */}
        <View style={styles.table}>
          <Text style={styles.rowLabel}>Price / night</Text>
          <View style={styles.columns}>
            {pair.map((stay) => (
              <View key={stay.id} style={styles.cell}>
                <Text style={styles.value}>{formatPrice(stay.price)}</Text>
                {stay.id === cheapest && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Cheapest</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.divider} />
          <Text style={styles.rowLabel}>Rating</Text>
          <View style={styles.columns}>
            {pair.map((stay) => (
              <View key={stay.id} style={styles.cell}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color={colors.star} />
                  <Text style={styles.ratingText}>
                    {stay.rating !== undefined ? stay.rating.toFixed(1) : '—'}
                  </Text>
                </View>
                {stay.id === topRated && (
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Top rated</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={styles.divider} />
          <Text style={styles.rowLabel}>City</Text>
          <View style={styles.columns}>
            {pair.map((stay) => (
              <View key={stay.id} style={styles.cell}>
                <Text style={styles.value}>{stay.city}</Text>
              </View>
            ))}
          </View>

          {amenityRows.map((row) => (
            <View key={row}>
              <View style={styles.divider} />
              <Text style={styles.rowLabel}>{row}</Text>
              <View style={styles.columns}>
                {pair.map((stay) => (
                  <View key={stay.id} style={styles.cell}>
                    {has(stay.amenities, row) ? (
                      <Ionicons name="checkmark" size={22} color={colors.dark} />
                    ) : (
                      <Ionicons name="close" size={22} color={colors.muted} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* View stay buttons */}
        <View style={styles.columns}>
          <Pressable style={[styles.actionButton, styles.outlineButton]} onPress={() => openStay(first.id)}>
            <Text style={styles.outlineText}>View stay</Text>
          </Pressable>
          <Pressable style={[styles.actionButton, styles.filledButton]} onPress={() => openStay(second.id)}>
            <Text style={styles.filledText}>View stay</Text>
          </Pressable>
        </View>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },

  columns: { flexDirection: 'row', gap: 12 },
  column: { flex: 1 },
  photo: { height: 150, borderRadius: 18, overflow: 'hidden', marginBottom: 8 },
  photoImage: { ...StyleSheet.absoluteFill },
  name: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 18 },

  table: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  rowLabel: { fontSize: 14, color: colors.muted, textAlign: 'center', marginVertical: 8 },
  cell: { flex: 1, alignItems: 'center', gap: 8, paddingBottom: 6 },
  value: { fontSize: 18, fontWeight: '800', color: colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 18, fontWeight: '800', color: colors.star },
  tag: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },

  actionButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: { borderWidth: 1, borderColor: colors.dark },
  outlineText: { fontSize: 16, fontWeight: '700', color: colors.dark },
  filledButton: { backgroundColor: colors.dark },
  filledText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  missing: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 16 },
  missingText: { fontSize: 16, color: colors.muted, textAlign: 'center' },
  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});