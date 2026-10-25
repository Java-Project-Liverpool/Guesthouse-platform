import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import LoginPrompt from '@/components/login-prompt';
import StayImage from '@/components/stay-image';
import { Colors, Radii, Typography } from '@/constants/theme';
import { useAuth } from '@/data/auth';
import { useStays } from '@/data/stays';

const colors = {
  background: '#F7F5F0',
  card: '#FFFFFF',
  dark: '#14352A',
  text: '#15201A',
  muted: '#5F6B64',
  border: '#C8CEC8',
  chip: '#EEF1EC',
  star: '#B7650A',
  heart: '#C0392B',
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { stays, loading, error, retry } = useStays();
  const [searchQuery, setSearchQuery] = useState('');

  const featured = stays.slice(0, 4);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {/* Branding header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Dumela Stays</Text>
            <Text style={styles.tagline}>Find your next stay.</Text>
          </View>
          <Pressable onPress={() => router.push('/account')} style={styles.profileBtn}>
            <Ionicons name="person-outline" size={22} color={colors.dark} />
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80' }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Where your next journey begins</Text>
            <Text style={styles.heroSub}>Discover welcoming guesthouses across Botswana, from riverside retreats to city stays.</Text>
            <Pressable onPress={() => router.push('/explore')} style={styles.ctaButton}>
              <Text style={styles.ctaText}>Explore stays</Text>
            </Pressable>
          </View>
        </View>

        {/* Search shortcut */}
        <View style={styles.searchCard}>
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guesthouses, cities..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => { if (searchQuery.trim()) router.push({ pathname: '/explore', params: { q: searchQuery.trim() } }); }}
            returnKeyType="search"
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
              <View key={f.label} style={styles.featureCard}>
                <Ionicons name={f.icon as any} size={24} color={colors.dark} />
                <Text style={styles.featureTitle}>{f.label}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Featured stays */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured stays</Text>
            <Pressable onPress={() => router.push('/explore')}>
              <Text style={styles.seeAll}>See all stays →</Text>
            </Pressable>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.dark} />
          ) : error ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Could not reach the server.</Text>
              <Pressable onPress={retry} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></Pressable>
            </View>
          ) : stays.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No visible stays found right now.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
              {featured.map((stay) => (
                <Pressable key={stay._id} onPress={() => router.push(`/details?id=${stay._id}`)} style={styles.card}>
                  <StayImage url={stay.photos?.[0]} style={styles.cardImage} />
                  <View style={styles.cardBody}>
                    <Text numberOfLines={1} style={styles.cardName}>{stay.name}</Text>
                    <Text style={styles.cardLocation}>{stay.city}</Text>
                    <Text style={styles.cardPrice}>${stay.pricePerNight || '--'} / night</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Favourites promo */}
        <Pressable onPress={() => router.push('/favourites')} style={styles.promo}>
          <Ionicons name="heart-outline" size={28} color={colors.dark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Save your favourites</Text>
            <Text style={styles.promoDesc}>Keep interesting guesthouses in one convenient place.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        {!user && <LoginPrompt />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
  brand: { fontSize: 22, fontWeight: '700', color: colors.dark, letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: colors.muted, marginTop: 2 },
  profileBtn: { padding: 8, borderRadius: 999 },
  hero: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden', position: 'relative', height: 320 },
  heroImage: { width: '100%', height: 320, resizeMode: 'cover' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: 'rgba(20,37,42,0.55)' },
  heroTitle: { fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 30 },
  heroSub: { fontSize: 14, color: '#EAECEA', marginTop: 6, lineHeight: 20 },
  ctaButton: { marginTop: 14, backgroundColor: '#fff', alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999 },
  ctaText: { fontWeight: '600', color: colors.dark, fontSize: 15 },
  searchCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.text },
  section: { marginHorizontal: 16, marginTop: 28 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.dark, letterSpacing: -0.5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.dark },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  featureCard: { width: '47%', backgroundColor: '#fff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  featureTitle: { fontWeight: '600', fontSize: 13, color: colors.dark, marginTop: 6 },
  featureDesc: { fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 16 },
  carousel: { paddingHorizontal: 4, paddingTop: 8 },
  card: { width: 260, marginRight: 12, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  cardImage: { width: 260, height: 160, borderRadius: 12 },
  cardBody: { padding: 10 },
  cardName: { fontWeight: '600', fontSize: 14, color: colors.dark },
  cardLocation: { fontSize: 12, color: colors.muted, marginTop: 2 },
  cardPrice: { fontSize: 13, fontWeight: '600', color: colors.dark, marginTop: 4 },
  promo: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, marginTop: 24, padding: 16, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  promoTitle: { fontWeight: '600', fontSize: 15, color: colors.dark },
  promoDesc: { fontSize: 13, color: colors.muted, marginTop: 2 },
  emptyBox: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: colors.muted },
  retryBtn: { marginTop: 10, backgroundColor: colors.dark, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
