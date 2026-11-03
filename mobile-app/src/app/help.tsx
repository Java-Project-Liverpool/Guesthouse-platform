import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function HelpScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const faqs = [
    { q: 'How do I save a guesthouse?', a: 'Tap the heart icon on any guesthouse card to save it to your favourites.' },
    { q: 'How do I change my password?', a: 'Open Settings → Change password and follow the on-screen instructions.' },
    { q: 'How do I report a problem?', a: 'Use the Report a problem option in Settings → Help & Support.' },
  ];
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={colors.primaryText} /></Pressable>
          <Text style={styles.headerTitle}>Help & FAQs</Text>
          <View style={styles.backButtonSpace} />
        </View>
        {faqs.map((faq, i) => (
          <View key={faq.q} style={[styles.card, i > 0 && { marginTop: 0 }]}>
            <View style={styles.rowIcon}><Ionicons name="help-circle-outline" size={20} color={colors.primaryText} /></View>
            <Text style={styles.q}>{faq.q}</Text>
            <Text style={styles.a}>{faq.a}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  backButtonSpace: { width: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 20, marginBottom: 20 },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  q: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  a: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});