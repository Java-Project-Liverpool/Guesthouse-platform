import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import GuesthouseCard from '@/components/guesthouse-card';
import { Colors, Radii, Typography } from '@/constants/theme';
import { useAuth } from '@/data/auth';
import { useFavourites } from '@/data/favourites';

export default function FavouritesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, restoring } = useAuth();
  const { saved, favourites, loading, error, retry, toggleSaved } = useFavourites();
  const [actionError, setActionError] = useState('');

  const compare = () => {
    if (saved.length < 2) {
      setActionError('Save at least two stays to compare them.');
      return;
    }
    router.push({ pathname: '/compare', params: { a: saved[0], b: saved[1] } });
  };

  const removeFavourite = async (id: string) => {
    try {
      await toggleSaved(id);
      setActionError('');
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : 'Could not remove this favourite.');
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton}>
            <Ionicons name="chevron-back" size={21} color={Colors.light.primary} />
          </Pressable>
          <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Favourites</Text>
            <Text style={styles.subtitle}>The guesthouses you want to remember.</Text>
          </View>
          {favourites.length > 1 ? (
            <Pressable onPress={compare} accessibilityRole="button" style={styles.compareButton}>
              <Ionicons name="git-compare-outline" size={17} color={Colors.light.primary} />
              <Text style={styles.compareText}>Compare</Text>
            </Pressable>
          ) : null}
        </View>

        {restoring || (user && loading) ? <ActivityIndicator style={styles.loader} size="large" color={Colors.light.primary} /> : null}

        {!restoring && !user ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}><Ionicons name="heart-outline" size={24} color={Colors.light.primary} /></View>
            <Text style={styles.stateTitle}>Save places for later</Text>
            <Text style={styles.stateBody}>Sign in to keep your favourite guesthouses together.</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/login')} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Log in or sign up</Text>
            </Pressable>
          </View>
        ) : null}

        {user && error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Favourites could not load</Text>
            <Text style={styles.stateBody}>{error}</Text>
            <Pressable style={styles.primaryButton} onPress={retry} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {user && !loading && !error && favourites.length === 0 ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}><Ionicons name="heart-outline" size={24} color={Colors.light.primary} /></View>
            <Text style={styles.stateTitle}>Your list is ready</Text>
            <Text style={styles.stateBody}>Tap the heart on a guesthouse to save it here.</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.push('/explore')} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Explore stays</Text>
            </Pressable>
          </View>
        ) : null}

        {user && !loading ? favourites.map((stay) => (
          <GuesthouseCard
            key={stay.id}
            stay={stay}
            saved
            onPress={() => router.push({ pathname: '/details', params: { id: stay.id } })}
            onToggleSaved={() => void removeFavourite(stay.id)}
          />
        )) : null}
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.light.border },
  eyebrow: { ...Typography.metadata, letterSpacing: 1.3, color: Colors.light.textSecondary },
  topBarSpacer: { width: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 17, marginBottom: 22 },
  headerCopy: { flex: 1 },
  title: { ...Typography.screenTitle, color: Colors.light.text },
  subtitle: { ...Typography.supporting, color: Colors.light.textSecondary, marginTop: 4 },
  compareButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, borderRadius: Radii.pill, backgroundColor: '#E6ECE5' },
  compareText: { ...Typography.metadata, fontWeight: '600', color: Colors.light.primary },
  loader: { marginTop: 40 },
  stateCard: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 36, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.light.border },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8EFE8', marginBottom: 12 },
  stateTitle: { ...Typography.cardTitle, textAlign: 'center', color: Colors.light.text },
  stateBody: { ...Typography.supporting, textAlign: 'center', color: Colors.light.textSecondary, marginTop: 7 },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 17, borderRadius: Radii.pill, backgroundColor: Colors.light.primary },
  primaryButtonText: { ...Typography.supporting, fontWeight: '600', color: '#FFFFFF' },
  error: { ...Typography.supporting, color: '#A13E37', marginTop: 8 },
});
