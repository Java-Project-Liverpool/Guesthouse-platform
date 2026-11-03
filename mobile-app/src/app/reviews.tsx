import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/data/auth';
import { getStay, getStayReviews, type GuesthouseReview, type Stay } from '@/data/stays';

import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function ReviewsScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const [stay, setStay] = useState<Stay | null>(null);
  const [reviews, setReviews] = useState<GuesthouseReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (id) Promise.all([getStay(id), getStayReviews(id)]).then(([listing, items]) => { if (active) { setStay(listing); setReviews(items); } }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load reviews.'); }).finally(() => { if (active) setLoading(false); });
    else return () => { active = false; };
    return () => { active = false; };
  }, [id]);
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={colors.primaryText} /></Pressable><Text style={styles.title}>Guest reviews</Text><View style={styles.back} /></View>
    {stay ? <Text style={styles.subtitle}>{stay.name}</Text> : null}
    {loading ? <ActivityIndicator color={colors.primaryText} style={{ marginTop: 32 }} /> : null}
    {error || !id ? <Text style={styles.empty}>{error || 'This review list is missing its guesthouse.'}</Text> : null}
    {!loading && !error && !reviews.length ? <Text style={styles.empty}>No guest reviews yet.</Text> : null}
    {reviews.map((item) => <View key={item.id} style={styles.card}><View style={styles.row}><Text style={styles.name}>{item.name}</Text><Text style={styles.rating}>★ {item.rating}</Text></View>{item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}</View>)}
    {user && stay ? <Pressable style={styles.primary} onPress={() => router.push({ pathname: '/write-review', params: { id: stay.id } })}><Text style={styles.primaryText}>Write a review</Text></Pressable> : null}
  </ScrollView></SafeAreaView>;
}
const makeStyles = (colors: AppPalette) => StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 20, fontWeight: '800', color: colors.text }, subtitle: { color: colors.textSecondary, marginTop: 12 }, empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 36, lineHeight: 23 }, card: { backgroundColor: colors.surface, padding: 18, borderRadius: 18, marginTop: 14, gap: 9 }, row: { flexDirection: 'row', justifyContent: 'space-between' }, name: { color: colors.text, fontWeight: '800' }, rating: { color: colors.secondary, fontWeight: '800' }, comment: { color: colors.textSecondary, lineHeight: 22 }, primary: { marginTop: 20, backgroundColor: colors.primary, padding: 15, borderRadius: 14, alignItems: 'center' }, primaryText: { color: colors.onPrimary, fontWeight: '800' } });
