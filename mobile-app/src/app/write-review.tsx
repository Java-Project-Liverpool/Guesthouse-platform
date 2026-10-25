import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StayImage from '@/components/stay-image';
import { ApiError } from '@/data/api';
import { logout, useAuth } from '@/data/auth';
import { getStay, submitStayReview, type Stay } from '@/data/stays';

const colors = { background: '#F7F5F0', card: '#FFFFFF', dark: '#14352A', text: '#15201A', muted: '#5F6B64', border: '#E1E5E0', star: '#B7650A', danger: '#B3261E' };

export default function WriteReviewScreen() {
  const router = useRouter();
  const { user, token, restoring } = useAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [stay, setStay] = useState<Stay | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (id) getStay(id).then((item) => { if (active) setStay(item); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load this guesthouse.'); }).finally(() => { if (active) setLoading(false); });
    else return () => { active = false; };
    return () => { active = false; };
  }, [id]);

  if (restoring) return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color={colors.dark} /></SafeAreaView>;
  if (!user || !token) return <Redirect href="/login" />;
  if (user.role !== 'customer') return <SafeAreaView style={styles.center}><Text style={styles.title}>Customer reviews only</Text><Text style={styles.note}>Sign in with a customer account to leave a review.</Text></SafeAreaView>;

  const submit = async () => {
    if (busy) return;
    if (rating < 1 || rating > 5) { setError('Choose a rating from 1 to 5 stars.'); return; }
    if (!id) { setError('This review is missing its guesthouse.'); return; }
    setBusy(true); setError('');
    try {
      await submitStayReview(id, token, rating, comment.trim());
      router.replace({ pathname: '/details', params: { id } });
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 401) await logout();
      setError(reason instanceof Error ? reason.message : 'Your review could not be submitted.');
    }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={colors.dark} /></Pressable><Text style={styles.headerTitle}>Write a review</Text><View style={styles.back} /></View>
    {!id ? <Text style={styles.error}>This review is missing its guesthouse.</Text> : loading ? <ActivityIndicator color={colors.dark} /> : stay ? <>
      <View style={styles.stayCard}><StayImage uri={stay.image} color={stay.color} style={styles.thumb} /><View style={styles.stayInfo}><Text style={styles.stayName}>{stay.name}</Text><Text style={styles.note}>{[stay.city, stay.country].filter(Boolean).join(', ')}</Text></View></View>
      <Text style={styles.centerLabel}>Your rating</Text><View style={styles.stars}>{[1, 2, 3, 4, 5].map((value) => <Pressable key={value} onPress={() => setRating(value)} accessibilityRole="button" accessibilityLabel={`${value} star${value === 1 ? '' : 's'}`}><Ionicons name={value <= rating ? 'star' : 'star-outline'} size={40} color={colors.star} /></Pressable>)}</View>
      <Text style={styles.label}>Your comment (optional)</Text><TextInput style={styles.input} placeholder="Share your experience" placeholderTextColor={colors.muted} multiline maxLength={2000} value={comment} onChangeText={setComment} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={[styles.primary, busy && styles.disabled]} onPress={() => void submit()} disabled={busy}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Submit review</Text>}</Pressable>
      <Text style={styles.note}>One review per guesthouse. Submitting again updates your existing review.</Text>
    </> : <Text style={styles.error}>{error}</Text>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }, back: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF1EC', alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  stayCard: { flexDirection: 'row', gap: 14, padding: 12, marginBottom: 28, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20 }, thumb: { width: 72, height: 72, borderRadius: 14 }, stayInfo: { flex: 1, justifyContent: 'center' }, stayName: { fontSize: 17, fontWeight: '800', color: colors.text }, title: { fontSize: 23, fontWeight: '800', color: colors.text },
  note: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: 8 }, centerLabel: { fontSize: 14, fontWeight: '700', color: colors.muted, textAlign: 'center', marginBottom: 12 }, stars: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 }, label: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: 8 }, input: { height: 110, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, fontSize: 15, color: colors.text, textAlignVertical: 'top', marginBottom: 20 }, error: { fontSize: 14, color: colors.danger, marginBottom: 14 }, primary: { height: 54, backgroundColor: colors.dark, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' }, disabled: { opacity: 0.7 },
});
