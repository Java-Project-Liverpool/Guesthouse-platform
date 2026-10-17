import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

// Sample reviews, shown for sample stays only (the backend has no ratings route yet)
const reviews = [
  { name: 'Neo M.', date: '12 Sep 2026', rating: 5, comment: 'Quiet, clean and right on the river. Loved the breakfast.' },
  { name: 'Lesedi K.', date: '2 Sep 2026', rating: 4, comment: 'Great host and easy to reach on WhatsApp.' },
  { name: 'Kabo T.', date: '28 Aug 2026', rating: 5, comment: 'Beautiful location and very friendly staff.' },
];

export default function ReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { stays } = useStays();
  const stay = stays.find((item) => item.id === id) ?? stays[0];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.headerTitle}>Reviews</Text>
          <View style={styles.backButtonSpace} />
        </View>

        {stay?.rating !== undefined ? (
          <View style={styles.summary}>
            <Ionicons name="star" size={22} color={colors.star} />
            <Text style={styles.summaryRating}>{stay.rating.toFixed(1)}</Text>
            <Text style={styles.summaryCount}>{stay.ratings} ratings</Text>
          </View>
        ) : (
          <Text style={styles.empty}>No ratings yet</Text>
        )}

        {stay?.sample &&
          reviews.map((review) => (
            <View key={review.name} style={styles.card}>
              <View style={styles.reviewTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{review.name.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                <View style={styles.row}>
                  <Ionicons name="star" size={16} color={colors.star} />
                  <Text style={styles.ratingText}>{review.rating}</Text>
                </View>
              </View>
              <Text style={styles.comment}>{review.comment}</Text>
            </View>
          ))}

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push({ pathname: '/write-review', params: { id: stay?.id } })}>
          <Text style={styles.primaryText}>Write a review</Text>
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
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

  summary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 22 },
  summaryRating: { fontSize: 32, fontWeight: '800', color: colors.text },
  summaryCount: { fontSize: 15, color: colors.muted },
  empty: { fontSize: 15, color: colors.muted, marginBottom: 22 },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: colors.dark },
  reviewName: { fontSize: 15, fontWeight: '800', color: colors.text },
  reviewDate: { fontSize: 13, color: colors.muted },
  ratingText: { fontSize: 15, fontWeight: '800', color: colors.star },
  comment: { fontSize: 14, color: colors.muted, lineHeight: 21 },

  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});