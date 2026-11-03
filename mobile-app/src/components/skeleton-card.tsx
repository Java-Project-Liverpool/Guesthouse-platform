import { View, StyleSheet } from 'react-native';
export default function SkeletonCard() {
  return <View style={styles.card}><View style={styles.imagePlaceholder} /><View style={styles.textPlaceholder} /><View style={styles.textPlaceholderShort} /></View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: '#F2F0EB', borderRadius: 16, padding: 16, marginBottom: 12, height: 280 }, imagePlaceholder: { width: '100%', height: 160, borderRadius: 12, backgroundColor: '#E8E5DB' }, textPlaceholder: { height: 14, borderRadius: 6, backgroundColor: '#E0DDD5', marginTop: 14, width: '70%' }, textPlaceholderShort: { height: 10, borderRadius: 6, backgroundColor: '#DDDAD2', marginTop: 8, width: '40%' } });
