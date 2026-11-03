import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import GuesthouseCard from '@/components/guesthouse-card';
import { Radii, Typography, type AppPalette } from '@/constants/theme';
import { toggleCompareStay, useComparison } from '@/data/comparison';
import { useAuth } from '@/data/auth';
import { useFavourites } from '@/data/favourites';
import type { Stay } from '@/data/stays';
import { useTabBarPadding } from '@/hooks/use-tab-bar-padding';

import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';

export default function FavouritesScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const tabBarPadding = useTabBarPadding();
  const { user, restoring } = useAuth();
  const { favourites, loading, error, retry, toggleSaved } = useFavourites();
  const { stays: compareStays, has: isCompared } = useComparison();
  const [actionError, setActionError] = useState('');

  const openComparison = () => router.push('/compare');

  const toggleCompare = (stay: Stay) => {
    if (toggleCompareStay(stay) === 'full') {
      setActionError('You can compare up to 3 stays. Remove one from the comparison first.');
      return;
    }
    setActionError('');
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
        contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backButton}>
            <Ionicons name="chevron-back" size={21} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Favourites</Text>
            <Text style={styles.subtitle}>The guesthouses you want to remember.</Text>
          </View>
          {favourites.length > 0 ? (
            <Pressable onPress={openComparison} accessibilityRole="button" style={styles.compareButton}>
              <Ionicons name="git-compare-outline" size={17} color={colors.primaryText} />
              <Text style={styles.compareText}>{compareStays.length > 0 ? `Compare (${compareStays.length})` : 'Compare'}</Text>
            </Pressable>
          ) : null}
        </View>

        {restoring || (user && loading) ? <ActivityIndicator style={styles.loader} size="large" color={colors.primaryText} /> : null}

        {!restoring && !user ? (
          <View style={styles.stateCard}>
            <View style={styles.emptyIcon}><Ionicons name="heart-outline" size={24} color={colors.primaryText} /></View>
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
            <View style={styles.emptyIcon}><Ionicons name="heart-outline" size={24} color={colors.primaryText} /></View>
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
            compared={isCompared(stay.id)}
            onToggleCompare={() => toggleCompare(stay)}
            onPress={() => router.push({ pathname: '/details', params: { id: stay.id } })}
            onToggleSaved={() => void removeFavourite(stay.id)}
          />
        )) : null}
        {actionError ? <Text style={styles.error}>{actionError}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  eyebrow: { ...Typography.metadata, letterSpacing: 1.3, color: colors.textSecondary },
  topBarSpacer: { width: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 17, marginBottom: 22 },
  headerCopy: { flex: 1 },
  title: { ...Typography.screenTitle, color: colors.text },
  subtitle: { ...Typography.supporting, color: colors.textSecondary, marginTop: 4 },
  compareButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, borderRadius: Radii.pill, backgroundColor: colors.chip },
  compareText: { ...Typography.metadata, fontWeight: '600', color: colors.primaryText },
  loader: { marginTop: 40 },
  stateCard: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 36, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  emptyIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip, marginBottom: 12 },
  stateTitle: { ...Typography.cardTitle, textAlign: 'center', color: colors.text },
  stateBody: { ...Typography.supporting, textAlign: 'center', color: colors.textSecondary, marginTop: 7 },
  primaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 17, borderRadius: Radii.pill, backgroundColor: colors.primary },
  primaryButtonText: { ...Typography.supporting, fontWeight: '600', color: colors.onPrimary },
  error: { ...Typography.supporting, color: colors.error, marginTop: 8 },
});
