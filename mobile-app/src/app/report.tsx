import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function ReportScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={colors.primaryText} /></Pressable>
          <Text style={styles.headerTitle}>Report a problem</Text>
          <View style={styles.backButtonSpace} />
        </View>
        <View style={[styles.card, { padding: 20 }]}>
          <Text style={styles.body}>If you have encountered a problem with Dumela Stays, please describe the issue including the page or action involved, any error messages shown, and the steps you took before the issue occurred. We will review your report and respond as soon as possible.</Text>
        </View>
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
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginBottom: 20 },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
});