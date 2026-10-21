import { Ionicons } from '@expo/vector-icons';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/data/auth';
import { useStays } from '@/data/stays';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#E1E5E0',
  inputBorder: '#C8CEC8',
  chip: '#EEF1EC',
  star: '#B7650A',
  danger: '#B3261E',
};

export default function WriteReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, rating: startRating } = useLocalSearchParams<{ id?: string; rating?: string }>();
  const { stays } = useStays();
  const [rating, setRating] = useState(Number(startRating) || 0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Only logged-in customers can review
  if (!user) return <Redirect href="/login" />;

  const stay = stays.find((item) => item.id === id) ?? stays[0];
  if (!stay) return null;

  const submit = () => {
    if (rating === 0) return setError('Tap a star to choose your rating.');
    setError('');
    // Placeholder: send { rating, comment } to the backend once the ratings route exists
    setDone(true);
  };

  // Thanks for rating
  if (done) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={32} color={colors.dark} />
          </View>
          <Text style={styles.doneTitle}>Thanks for rating</Text>
          <Text style={styles.doneText}>You rated {stay.name}</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryText}>Back to guesthouse</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => router.replace('/')}>
            <Text style={styles.outlineText}>Browse more</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.headerTitle}>Write a review</Text>
          <View style={styles.backButtonSpace} />
        </View>

        <View style={styles.stayCard}>
          <View style={[styles.thumb, { backgroundColor: stay.color }]}>
            {stay.image ? (
              <Image source={{ uri: stay.image }} style={styles.thumbImage} resizeMode="cover" />
            ) : null}
          </View>
          <View style={styles.stayInfo}>
            <Text style={styles.stayName}>{stay.name}</Text>
            <Text style={styles.stayCity}>{stay.city}, Botswana</Text>
          </View>
        </View>

        <Text style={styles.centerLabel}>Your rating</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable key={value} onPress={() => setRating(value)}>
              <Ionicons
                name={value <= rating ? 'star' : 'star-outline'}
                size={40}
                color={colors.star}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Your comment (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Share your experience"
          placeholderTextColor={colors.muted}
          multiline
          value={comment}
          onChangeText={setComment}
        />

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.primaryButton} onPress={submit}>
          <Text style={styles.primaryText}>Submit review</Text>
        </Pressable>
        <Text style={styles.note}>Only logged-in customers can review.</Text>
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

  stayCard: {
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    marginBottom: 28,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
  },
  thumb: { width: 72, height: 72, borderRadius: 14, overflow: 'hidden' },
  thumbImage: { ...StyleSheet.absoluteFill },
  stayInfo: { flex: 1, justifyContent: 'center' },
  stayName: { fontSize: 17, fontWeight: '800', color: colors.text },
  stayCity: { fontSize: 14, color: colors.muted, marginTop: 2 },

  centerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 12,
  },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 },
  label: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: 8 },
  input: {
    height: 110,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    fontSize: 15,
    color: colors.text,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  error: { fontSize: 14, color: colors.danger, marginBottom: 14 },
  primaryButton: {
    height: 54,
    backgroundColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  note: { fontSize: 14, color: colors.muted, textAlign: 'center' },

  // Thanks for rating
  doneWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  doneIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  doneTitle: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  doneText: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 32,
  },
  outlineButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.dark,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontSize: 16, fontWeight: '700', color: colors.dark },
});