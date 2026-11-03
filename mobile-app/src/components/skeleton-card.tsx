import { View, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

export default function SkeletonCard() {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.card}><View style={styles.imagePlaceholder} /><View style={styles.textPlaceholder} /><View style={styles.textPlaceholderShort} /></View>;
}
const makeStyles = (colors: AppPalette) => StyleSheet.create({ card: { backgroundColor: colors.skeletonHighlight, borderRadius: 16, padding: 16, marginBottom: 12, height: 280 }, imagePlaceholder: { width: '100%', height: 160, borderRadius: 12, backgroundColor: colors.skeleton }, textPlaceholder: { height: 14, borderRadius: 6, backgroundColor: colors.skeleton, marginTop: 14, width: '70%' }, textPlaceholderShort: { height: 10, borderRadius: 6, backgroundColor: colors.skeleton, marginTop: 8, width: '40%' } });
