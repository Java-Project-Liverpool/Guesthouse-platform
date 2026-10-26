import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const colors = { background: '#F7F5F0', card: '#FFFFFF', dark: '#14352A', text: '#15201A', muted: '#5F6B64', border: '#C8CEC8', chip: '#EEF1EC' };

export default function AboutScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={colors.dark} /></Pressable>
          <Text style={styles.headerTitle}>About Dumela Stays</Text>
          <View style={styles.backButtonSpace} />
        </View>
        <View style={[styles.card, { padding: 20 }]}>
          <View style={styles.infoIcon}><Ionicons name="leaf-outline" size={22} color={colors.dark} /></View>
          <Text style={styles.infoTitle}>Dumela Stays</Text>
          <Text style={styles.infoBody}>Guesthouse discovery for Botswana. Version 1.0.0.</Text>
          <Text style={styles.infoBody}>Built with React Native and Expo.</Text>
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
  infoIcon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  infoTitle: { fontSize: 18, color: colors.text, fontWeight: '800', marginBottom: 6 },
  infoBody: { fontSize: 15, color: colors.muted, lineHeight: 22, marginBottom: 8 },
});