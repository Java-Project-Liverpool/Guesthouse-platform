import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StayImage from '@/components/stay-image';
import { useStays } from '@/data/stays';
import { useTabBarPadding } from '@/hooks/use-tab-bar-padding';
import { formatPula } from '@/utils/currency';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function HomeScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const tabBarPadding = useTabBarPadding();
  const { stays, loading, error, retry } = useStays();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { retry(); } catch {}
    setRefreshing(false);
  };

  const featured = stays.slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingBottom: tabBarPadding }}
        showsVerticalScrollIndicator={false}>
        {/* Branding header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image source={require('@/assets/images/logo.png')} style={{ width: 36, height: 36, resizeMode: 'contain' }} />
            <View>
              <Text style={styles.brand}>Dumela Stays</Text>
              <Text style={styles.tagline}>Find your next stay in Botswana.</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/account')} style={styles.profileBtn} accessibilityRole="button" accessibilityLabel="Account">
            <Ionicons name="person-outline" size={22} color={colors.primaryText} />
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80' }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Where your next journey begins</Text>
            <Text style={styles.heroSub}>Discover welcoming guesthouses across Botswana, from riverside retreats to city stays.</Text>
            <Pressable onPress={() => router.push('/explore')} style={styles.ctaButton} accessibilityRole="button">
              <Text style={styles.ctaText}>Explore stays</Text>
            </Pressable>
          </View>
        </View>

        {/* Search shortcut */}
        <View style={styles.searchCard}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guesthouses, cities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => { if (searchQuery.trim()) router.push({ pathname: '/explore', params: { q: searchQuery.trim() } }); }}
            returnKeyType="search"
            accessibilityLabel="Search guesthouses"
          />
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What Dumela offers</Text>
          <View style={styles.featuresGrid}>
            {[
              { icon: 'compass-outline', label: 'Discover local stays', desc: 'Explore guesthouses in cities across Botswana.' },
              { icon: 'location-outline', label: 'Find the right location', desc: 'Discover accommodation by city or destination.' },
              { icon: 'list-outline', label: 'Compare options', desc: 'Review prices, ratings, and listing details.' },
              { icon: 'heart-outline', label: 'Save favourites', desc: 'Keep interesting stays in one place.' },
            ].map((f) => (
              <Pressable key={f.label} onPress={() => router.push('/explore')} style={styles.featureCard} accessibilityRole="button">
                <Ionicons name={f.icon as any} size={22} color={colors.primaryText} />
                <Text style={styles.featureTitle}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured stays */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured stays</Text>
            <Pressable onPress={() => router.push('/explore')} accessibilityRole="button">
              <Text style={styles.seeAll}>See all →</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primaryText} size="small" />
              <Text style={styles.loadingText}>Loading stays…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Ionicons name="cloud-offline-outline" size={32} color={colors.primaryText} />
              <Text style={styles.errorTitle}>Could not reach the server</Text>
              <Text style={styles.errorCopy}>{error}</Text>
              <Pressable onPress={retry} style={styles.retryBtn} accessibilityRole="button">
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          ) : stays.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="bed-outline" size={32} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No visible stays found</Text>
              <Text style={styles.emptyCopy}>Check back soon for new listings.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
              {featured.map((stay) => (
                <Pressable key={stay.id} onPress={() => router.push(`/details?id=${stay.id}`)} style={styles.card} accessibilityRole="button">
                  <StayImage uri={stay.image} color={stay.color} style={styles.cardImage} />
                  <View style={styles.cardBody}>
                    <Text numberOfLines={1} style={styles.cardName}>{stay.name}</Text>
                    <Text style={styles.cardLocation}>{stay.city}</Text>
                    <Text style={styles.cardPrice}>{stay.price !== undefined ? `${formatPula(stay.price)} / night` : '-- / night'}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Favourites promo */}
        <Pressable onPress={() => router.push('/favourites')} style={styles.promo} accessibilityRole="button">
          <Ionicons name="heart-outline" size={28} color={colors.primaryText} />
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Save your favourites</Text>
            <Text style={styles.promoDesc}>Keep interesting guesthouses in one convenient place.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 22, fontWeight: '700', color: colors.primaryText, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  profileBtn: { padding: 8, borderRadius: 999, backgroundColor: colors.chip },
  hero: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden', position: 'relative', height: 320 },
  heroImage: { width: '100%', height: 320, resizeMode: 'cover' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(20,37,42,0.55)' },
  heroTitle: { fontSize: 26, fontWeight: '700', color: colors.onPrimary, lineHeight: 30 },
  heroSub: { fontSize: 14, color: colors.divider, marginTop: 6, lineHeight: 20 },
  ctaButton: { marginTop: 14, backgroundColor: colors.surface, alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 },
  ctaText: { fontWeight: '600', color: colors.primaryText, fontSize: 15 },
  searchCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, backgroundColor: colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.text },
  section: { marginHorizontal: 16, marginTop: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.primaryText, letterSpacing: -0.5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.primaryText },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  featureCard: { width: '47%', backgroundColor: colors.surface, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  featureTitle: { fontWeight: '600', fontSize: 13, color: colors.primaryText, marginTop: 6 },
  featureDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 16 },
  carousel: { paddingHorizontal: 4, paddingTop: 8 },
  card: { width: 260, marginRight: 12, backgroundColor: colors.surface, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, shadowColor: colors.overlay, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardImage: { width: 260, height: 160, borderRadius: 12 },
  cardBody: { padding: 10 },
  cardName: { fontWeight: '600', fontSize: 14, color: colors.primaryText },
  cardLocation: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: '600', color: colors.primaryText, marginTop: 4 },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 24, padding: 16, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  promoTitle: { fontWeight: '600', fontSize: 15, color: colors.primaryText },
  promoDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24, justifyContent: 'center' },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  errorCard: { paddingVertical: 36, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: colors.primaryText, marginTop: 10 },
  errorCopy: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center', paddingHorizontal: 16 },
  retryBtn: { marginTop: 12, backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 },
  retryText: { color: colors.onPrimary, fontWeight: '600', fontSize: 13 },
  emptyCard: { paddingVertical: 36, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginTop: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.primaryText, marginTop: 10 },
  emptyCopy: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
