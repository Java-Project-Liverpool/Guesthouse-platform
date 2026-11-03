import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginPrompt from '@/components/login-prompt';
import StayImage from '@/components/stay-image';
import { MAX_COMPARE_STAYS, toggleCompareStay, useComparison } from '@/data/comparison';
import { useAuth } from '@/data/auth';
import { useFavourites } from '@/data/favourites';
import { getStay, getStayReviews, type GuesthouseReview, type Stay } from '@/data/stays';

import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';
import { formatPula } from '@/utils/currency';

const money = formatPula;

export default function DetailsScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { saved, toggleSaved } = useFavourites();
  const { stays: compareStays, has: isCompared } = useComparison();
  const [stay, setStay] = useState<Stay | null>(null);
  const [reviews, setReviews] = useState<GuesthouseReview[]>([]);
  const [reviewError, setReviewError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    if (!id) return () => { active = false; };
    Promise.resolve()
      .then(() => {
        if (active) { setLoading(true); setError(''); }
        return getStay(id);
      })
      .then((listing) => {
        if (active) setStay(listing);
        return getStayReviews(id).then((guestReviews) => { if (active) { setReviews(guestReviews); setReviewError(false); } }).catch(() => { if (active) setReviewError(true); });
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Could not load this guesthouse.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, retry]);

  const contact = async (url?: string) => {
    if (!url) return;
    try { await Linking.openURL(url); }
    catch { setActionError('This contact method is not available on this device.'); }
  };
  const openMap = () => {
    if (stay?.latitude === undefined || stay.longitude === undefined) return;
    void contact(`https://www.google.com/maps/search/?api=1&query=${stay.latitude},${stay.longitude}`);
  };
  const changeFavourite = async () => {
    if (!user) { setPromptOpen(true); return; }
    try { await toggleSaved(stay!.id, stay!); setActionError(''); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Could not update favourites.'); }
  };

  const compareThisStay = () => {
    if (!stay) return;
    if (toggleCompareStay(stay) === 'full') {
      Alert.alert('Comparison is full', `You can compare up to ${MAX_COMPARE_STAYS} stays. Remove one from the comparison first.`);
    }
  };

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={colors.primaryText} /><Text style={styles.hint}>Waking the guesthouse service if it has been idle…</Text></SafeAreaView>;
  if (error || !stay || !id) return (
    <SafeAreaView style={styles.center}>
      <Ionicons name="home-outline" size={42} color={colors.primaryText} />
      <Text style={styles.title}>{error.includes('could not be found') ? 'Listing unavailable' : 'We couldn’t open this stay'}</Text>
      <Text style={styles.hint}>{error || (!id ? 'This guesthouse link is missing its listing ID.' : 'This guesthouse is not available.')}</Text>
      <Pressable style={styles.primary} onPress={() => setRetry((value) => value + 1)}><Text style={styles.primaryText}>Try again</Text></Pressable>
      <Pressable onPress={() => router.back()}><Text style={styles.link}>Go back</Text></Pressable>
    </SafeAreaView>
  );

  const isSaved = saved.includes(stay.id);
  const average = reviews.length ? reviews.reduce((total, item) => total + item.rating, 0) / reviews.length : stay.rating;
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 36 }}>
        <View style={[styles.hero, { backgroundColor: stay.color }]}>
          <StayImage uri={stay.image} color={stay.color} style={StyleSheet.absoluteFill} />
          <View style={[styles.heroActions, { paddingTop: insets.top + 10 }]}>
            <Pressable style={styles.round} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back"><Ionicons name="chevron-back" size={22} color={colors.primaryText} /></Pressable>
            <Pressable style={styles.round} onPress={() => void changeFavourite()} accessibilityRole="button" accessibilityLabel={isSaved ? 'Remove from favourites' : 'Add to favourites'}><Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={22} color={isSaved ? colors.error : colors.primaryText} /></Pressable>
          </View>
          {stay.images.length > 1 && <Pressable style={styles.galleryButton} onPress={() => router.push({ pathname: '/gallery', params: { id: stay.id } })}><Ionicons name="images-outline" size={17} color={colors.text} /><Text style={styles.galleryText}>View all {stay.images.length} photos</Text></Pressable>}
        </View>
        <View style={styles.sheet}>
          <Text style={styles.eyebrow}>{stay.verified ? 'VERIFIED STAY' : 'GUESTHOUSE'}</Text>
          <Text style={styles.title}>{stay.name}</Text>
          {(stay.city || stay.country) ? <View style={styles.inline}><Ionicons name="location-outline" size={17} color={colors.textSecondary} /><Text style={styles.muted}>{[stay.city, stay.country].filter(Boolean).join(', ')}</Text></View> : null}
          {(average !== undefined || stay.price !== undefined) && <View style={styles.facts}>
            {average !== undefined && <View style={styles.inline}><Ionicons name="star" size={17} color={colors.secondary} /><Text style={styles.fact}>{average.toFixed(1)}{reviews.length ? ` · ${reviews.length} reviews` : stay.ratings ? ` · ${stay.ratings} reviews` : ''}</Text></View>}
            {stay.price !== undefined && <Text style={styles.price}>{money(stay.price)} <Text style={styles.muted}>/ night</Text></Text>}
          </View>}
          <Pressable
            onPress={compareThisStay}
            accessibilityRole="button"
            accessibilityState={{ selected: isCompared(stay.id) }}
            style={({ pressed }) => [styles.compareAction, isCompared(stay.id) && styles.compareActionActive, pressed && { opacity: 0.85 }]}>
            <Ionicons name={isCompared(stay.id) ? 'checkmark-circle' : 'git-compare-outline'} size={19} color={isCompared(stay.id) ? colors.onPrimary : colors.primaryText} />
            <Text style={[styles.compareActionText, isCompared(stay.id) && styles.compareActionTextActive]}>
              {isCompared(stay.id) ? 'Added to comparison' : 'Add to comparison'}
            </Text>
          </Pressable>
          {compareStays.length > 0 ? (
            <Pressable onPress={() => router.push('/compare')} accessibilityRole="button" style={styles.compareLink}>
              <Text style={styles.link}>View comparison ({compareStays.length})</Text>
            </Pressable>
          ) : null}
          {stay.description ? <><Text style={styles.sectionTitle}>About this stay</Text><Text style={styles.body}>{stay.description}</Text></> : null}
          {stay.amenities.length > 0 && <><Text style={styles.sectionTitle}>Amenities</Text><View style={styles.amenities}>{stay.amenities.map((item) => <View key={item} style={styles.amenity}><Ionicons name="checkmark-circle-outline" size={17} color={colors.primaryText} /><Text style={styles.body}>{item}</Text></View>)}</View></>}
          {(stay.phone || stay.email) && <><Text style={styles.sectionTitle}>Contact</Text><View style={styles.contactCard}>
            {stay.phone ? <Pressable style={styles.contactRow} onPress={() => void contact(`tel:${stay.phone}`)}><Ionicons name="call-outline" size={19} color={colors.primaryText} /><Text style={styles.body}>{stay.phone}</Text></Pressable> : null}
            {stay.email ? <Pressable style={styles.contactRow} onPress={() => void contact(`mailto:${stay.email}`)}><Ionicons name="mail-outline" size={19} color={colors.primaryText} /><Text style={styles.body}>{stay.email}</Text></Pressable> : null}
          </View></>}
          {(stay.latitude !== undefined && stay.longitude !== undefined) && <Pressable style={styles.mapButton} onPress={openMap}><Ionicons name="navigate-outline" size={19} color={colors.primaryText} /><Text style={styles.mapText}>Open location in Maps</Text></Pressable>}
          <View style={styles.reviewHeader}><Text style={styles.sectionTitle}>Guest reviews</Text>{user?.role === 'customer' && <Pressable onPress={() => router.push({ pathname: '/write-review', params: { id: stay.id } })}><Text style={styles.link}>Write a review</Text></Pressable>}</View>
          {reviewError ? <Text style={styles.muted}>Reviews are temporarily unavailable.</Text> : reviews.length ? reviews.map((review) => <View key={review.id} style={styles.reviewCard}><View style={styles.reviewHeading}><Text style={styles.reviewName}>{review.name}</Text><Text style={styles.reviewScore}>★ {review.rating}</Text></View>{review.comment ? <Text style={styles.body}>{review.comment}</Text> : null}</View>) : <Text style={styles.muted}>No guest reviews yet.</Text>}
          {!user && <Pressable onPress={() => setPromptOpen(true)}><Text style={styles.link}>Sign in to share your experience</Text></Pressable>}
          {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
          <Text style={styles.bookingNote}>Contact the guesthouse directly to ask about rates and availability.</Text>
        </View>
      </ScrollView>
      <LoginPrompt visible={promptOpen} onClose={() => setPromptOpen(false)} />
    </View>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, backgroundColor: colors.background },
  hint: { color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  hero: { height: 340, overflow: 'hidden' },
  heroActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18 },
  round: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFFFFFE8', alignItems: 'center', justifyContent: 'center' },
  galleryButton: { position: 'absolute', bottom: 18, right: 18, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, backgroundColor: '#FFFFFFE8', flexDirection: 'row', alignItems: 'center', gap: 7 },
  galleryText: { fontWeight: '700', color: colors.text },
  sheet: { marginTop: -24, backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 22 },
  eyebrow: { color: colors.primaryText, fontSize: 11, letterSpacing: 1.5, fontWeight: '800', marginBottom: 8 },
  title: { fontSize: 27, lineHeight: 34, fontWeight: '800', color: colors.text, marginBottom: 8 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  muted: { color: colors.textSecondary, fontSize: 15 },
  facts: { minHeight: 58, marginTop: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.divider, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fact: { color: colors.text, fontWeight: '700' },
  price: { color: colors.text, fontSize: 18, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 23, marginBottom: 10 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 23 },
  amenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenity: { minWidth: '46%', flexDirection: 'row', alignItems: 'center', gap: 7 },
  contactCard: { backgroundColor: colors.surface, padding: 15, borderRadius: 16, gap: 14 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  mapText: { color: colors.primaryText, fontWeight: '700' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 15, marginBottom: 10, gap: 8 },
  reviewHeading: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewName: { fontWeight: '800', color: colors.text },
  reviewScore: { color: colors.secondary, fontWeight: '800' },
  link: { color: colors.primaryText, fontWeight: '800', marginTop: 8 },
  bookingNote: { borderTopWidth: 1, borderColor: colors.divider, marginTop: 24, paddingTop: 16, color: colors.textSecondary, lineHeight: 22 },
  error: { color: colors.error, marginTop: 12 },
  compareAction: { marginTop: 16, height: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  compareActionActive: { backgroundColor: colors.primary },
  compareActionText: { color: colors.primaryText, fontWeight: '700', fontSize: 15 },
  compareActionTextActive: { color: colors.onPrimary },
  compareLink: { alignSelf: 'center', marginTop: 10, minHeight: 32, justifyContent: 'center' },
  primary: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14 },
  primaryText: { color: colors.onPrimary, fontWeight: '800' },
});
