import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = { background: '#F7F5F0', card: '#FFFFFF', dark: '#14352A', text: '#15201A', muted: '#5F6B64', border: '#C8CEC8', chip: '#EEF1EC' };

export default function SupportScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={colors.dark} /></Pressable>
          <Text style={styles.headerTitle}>Contact support</Text>
          <View style={styles.backButtonSpace} />
        </View>
        <View style={[styles.card, { padding: 20 }]}>
          <View style={styles.rowIcon}><Ionicons name="mail-outline" size={20} color={colors.dark} /></View>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>support@dumelastays.co.bw</Text>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>+267 390 0000</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  backButtonSpace: { width: 44 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, marginBottom: 20 },
  rowIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: 14 },
  value: { fontSize: 16, fontWeight: '600', color: colors.text },
});