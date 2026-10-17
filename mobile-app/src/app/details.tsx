import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFavourites } from '@/data/favourites';
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
  heart: '#C0392B',
};

// Sample rating breakdown (5, 4, 3, 2 and 1 stars) and reviews.
// Only shown for sample stays, because the backend has no ratings route yet.
const breakdown = [78, 15, 5, 1, 1];

const reviews = [
  { name: 'Neo M.', date: '12 Sep 2026', rating: 5, comment: 'Quiet, clean and right on the river. Loved the breakfast.' },
  { name: 'Lesedi K.', date: '2 Sep 2026', rating: 4, comment: 'Great host and easy to reach on WhatsApp.' },
];

function formatPrice(price: number) {
  return 'P' + price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Picks an icon for an amenity name
function iconFor(
  label: string
): 'wifi' | 'water-outline' | 'cafe-outline' | 'car-outline' | 'checkmark-circle-outline' {
  const name = label.toLowerCase();
  if (name.includes('wi')) return 'wifi';
  if (name.includes('pool')) return 'water-outline';
  if (name.includes('breakfast')) return 'cafe-outline';
  if (name.includes('park')) return 'car-outline';
  return 'checkmark-circle-outline';
}

export default function DetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { stays, loading } = useStays();
  const { saved: savedIds, toggleSaved } = useFavourites();
  const [myRating, setMyRating] = useState(0);
  const [comment, setComment] = useState('');

  if (loading || stays.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.dark} />
      </View>
    );
  }

  const stay = stays.find((item) => item.id === id) ?? stays[0];
  const saved = savedIds.includes(stay.id);
  const initials = stay.name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  const more = stays
    .filter((item) => item.id !== stay.id)
    .sort((a, b) => Number(b.city === stay.city) - Number(a.city === stay.city))
    .slice(0, 2);
  const moreTitle =
    more.length > 0 && more.every((item) => item.city === stay.city) ? 'More in ' + stay.city : 'More stays';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero photo with buttons */}
        <View style={[styles.hero, { backgroundColor: stay.color }]}>
          {stay.image ? (
            <Image source={{ uri: stay.image }} style={styles.heroImage} resizeMode="cover" />
          ) : null}
          <Pressable style={[styles.roundButton, { top: insets.top + 16, left: 20 }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <View style={[styles.heroRight, { top: insets.top + 16 }]}>
            <Pressable style={styles.roundButtonStatic}>
              <Ionicons name="share-outline" size={22} color={colors.dark} />
            </Pressable>
            <Pressable style={styles.roundButtonStatic} onPress={() => toggleSaved(stay.id)}>
              <Ionicons
                name={saved ? 'heart' : 'heart-outline'}
                size={22}
                color={saved ? colors.heart : colors.dark}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.sheet}>
          {/* Name and location */}
          <View style={styles.nameRow}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{initials}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.title}>{stay.name}</Text>
              <View style={styles.row}>
                <Ionicons name="location-outline" size={16} color={colors.muted} />
                <Text style={styles.muted}>{stay.city}, Botswana</Text>
              </View>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badges}>
            {stay.verified && (
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.dark} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
            {(stay.rating ?? 0) >= 4.8 && (
              <View style={styles.badge}>
                <Ionicons name="star" size={16} color={colors.star} />
                <Text style={styles.badgeText}>Guest favourite</Text>
              </View>
            )}
          </View>

          {/* Price and rating */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatPrice(stay.price)} <Text style={styles.perNight}>/ night</Text>
            </Text>
            {stay.rating !== undefined ? (
              <View style={styles.row}>
                <Ionicons name="star" size={16} color={colors.star} />
                <Text style={styles.ratingText}>
                  {stay.rating.toFixed(1)} · {stay.ratings} ratings
                </Text>
              </View>
            ) : (
              <Text style={styles.muted}>No ratings yet</Text>
            )}
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={[styles.muted, styles.paragraph]}>{stay.description}</Text>

          {/* Amenities */}
          {stay.amenities.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Amenities</Text>
              <View style={styles.amenities}>
                {stay.amenities.map((label) => (
                  <View key={label} style={styles.amenity}>
                    <Ionicons name={iconFor(label)} size={22} color={colors.muted} />
                    <Text style={styles.amenityText}>{label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Location */}
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={[styles.row, styles.locationRow]}>
            <Ionicons name="location-outline" size={18} color={colors.muted} />
            <Text style={styles.muted}>
              {stay.city}, Botswana · {stay.latitude}, {stay.longitude}
            </Text>
          </View>

          {/* Rating breakdown and reviews (sample stays only) */}
          {stay.sample && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Rating breakdown</Text>
                {breakdown.map((percent, index) => (
                  <View key={index} style={styles.barRow}>
                    <Text style={styles.barLabel}>{5 - index}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${percent}%` }]} />
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.reviewsHeader}>
                <Text style={styles.sectionTitleFlat}>Guest reviews</Text>
                <Text style={styles.seeAll}>See all</Text>
              </View>
              {reviews.map((review) => (
                <View key={review.name} style={[styles.card, styles.reviewCard]}>
                  <View style={styles.reviewTop}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarSmallText}>{review.name.slice(0, 2).toUpperCase()}</Text>
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
                  <Text style={styles.muted}>{review.comment}</Text>
                </View>
              ))}
            </>
          )}

          {/* Contact buttons */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.actionButton, styles.whatsappButton]}
              onPress={() => Linking.openURL('https://wa.me/' + stay.phone.replace(/[^\d]/g, ''))}>
              <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              <Text style={styles.whatsappText}>WhatsApp</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, styles.callButton]}
              onPress={() => Linking.openURL('tel:' + stay.phone)}>
              <Ionicons name="call-outline" size={20} color={colors.dark} />
              <Text style={styles.callText}>Call</Text>
            </Pressable>
          </View>

          {/* Rate your experience (not connected to the backend yet) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Rate your experience</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Pressable key={value} onPress={() => setMyRating(value)}>
                  <Ionicons
                    name={value <= myRating ? 'star' : 'star-outline'}
                    size={38}
                    color={colors.star}
                  />
                </Pressable>
              ))}
            </View>
            <Text style={styles.commentLabel}>Add a comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience"
              placeholderTextColor={colors.muted}
              multiline
              value={comment}
              onChangeText={setComment}
            />
            <Pressable style={styles.submitButton}>
              <Text style={styles.submitText}>Submit review</Text>
            </Pressable>
          </View>

          {/* More stays */}
          {more.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{moreTitle}</Text>
              <View style={styles.moreRow}>
                {more.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.moreCard}
                    onPress={() => router.push({ pathname: '/details', params: { id: item.id } })}>
                    <View style={[styles.morePhoto, { backgroundColor: item.color }]}>
                      {item.image ? (
                        <Image source={{ uri: item.image }} style={styles.moreImage} resizeMode="cover" />
                      ) : null}
                    </View>
                    <Text style={styles.moreName}>{item.name}</Text>
                    <Text style={styles.muted}>{formatPrice(item.price)} / night</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  muted: { fontSize: 14, color: colors.muted },

  // Hero
  hero: { height: 330 },
  heroImage: { ...StyleSheet.absoluteFill },
  roundButton: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRight: { position: 'absolute', right: 20, flexDirection: 'row', gap: 8 },
  roundButtonStatic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // White sheet that overlaps the photo
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    marginTop: -28,
    padding: 20,
    paddingTop: 24,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  // Name
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: { fontSize: 18, fontWeight: '800', color: colors.dark },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },

  // Badges
  badges: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: colors.chip,
  },
  badgeText: { fontSize: 14, fontWeight: '700', color: colors.text },

  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  price: { fontSize: 26, fontWeight: '800', color: colors.text },
  perNight: { fontSize: 14, fontWeight: '400', color: colors.muted },
  ratingText: { fontSize: 15, fontWeight: '800', color: colors.star },

  // Sections
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 10 },
  sectionTitleFlat: { fontSize: 18, fontWeight: '800', color: colors.text },
  paragraph: { lineHeight: 22, marginBottom: 22 },

  // Amenities
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 22 },
  amenity: {
    minWidth: 78,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  amenityText: { fontSize: 14, fontWeight: '700', color: colors.muted },

  locationRow: { marginBottom: 22 },

  // Cards
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 22,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 14 },

  // Rating breakdown
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  barLabel: { width: 14, fontSize: 15, color: colors.muted },
  barTrack: { flex: 1, height: 10, borderRadius: 5, backgroundColor: colors.chip },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.dark },

  // Reviews
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  seeAll: { fontSize: 14, fontWeight: '700', color: colors.muted },
  reviewCard: { marginBottom: 14 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: { fontSize: 14, fontWeight: '800', color: colors.dark },
  reviewName: { fontSize: 15, fontWeight: '800', color: colors.text },
  reviewDate: { fontSize: 13, color: colors.muted },

  // Contact buttons
  actions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 22 },
  actionButton: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
  },
  whatsappButton: { backgroundColor: colors.dark },
  whatsappText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  callButton: { borderWidth: 1, borderColor: colors.dark },
  callText: { fontSize: 16, fontWeight: '700', color: colors.dark },

  // Rate your experience
  stars: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  commentLabel: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  commentInput: {
    height: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // More stays
  moreRow: { flexDirection: 'row', gap: 12 },
  moreCard: { flex: 1 },
  morePhoto: { height: 100, borderRadius: 14, marginBottom: 8, overflow: 'hidden' },
  moreImage: { ...StyleSheet.absoluteFill },
  moreName: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
});