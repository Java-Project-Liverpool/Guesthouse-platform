import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import StayImage from '@/components/stay-image';
import { Radii, Typography, type AppPalette } from '@/constants/theme';
import type { Stay } from '@/data/stays';

import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';

type Props = {
  stay: Stay;
  onPress: () => void;
  saved?: boolean;
  onToggleSaved?: () => void;
  compared?: boolean;
  onToggleCompare?: () => void;
  compact?: boolean;
};

function formatPrice(value: number) {
  return `P${value.toLocaleString('en-US')}`;
}

export default function GuesthouseCard({
  stay,
  onPress,
  saved = false,
  onToggleSaved,
  compared = false,
  onToggleCompare,
  compact = false,
}: Props) {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.card, compact && styles.compactCard]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View ${stay.name}${stay.city ? ` in ${stay.city}` : ''}`}
        style={({ pressed }) => [styles.openButton, pressed && styles.pressed]}>
        <StayImage
          uri={stay.image}
          color={stay.color}
          style={[styles.photo, compact && styles.compactPhoto]}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{stay.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.location} numberOfLines={1}>
              {[stay.city, stay.country].filter(Boolean).join(', ') || 'Botswana'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            {stay.rating !== undefined && (
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color={colors.star} />
                <Text style={styles.ratingText}>{stay.rating.toFixed(1)}</Text>
                {stay.ratings ? <Text style={styles.reviewCount}>({stay.ratings})</Text> : null}
              </View>
            )}
            {stay.price !== undefined && (
              <Text style={styles.price}>
                {formatPrice(stay.price)}<Text style={styles.perNight}> / night</Text>
              </Text>
            )}
          </View>
        </View>
      </Pressable>

      {onToggleCompare ? (
        <Pressable
          onPress={onToggleCompare}
          accessibilityRole="button"
          accessibilityState={{ selected: compared }}
          accessibilityLabel={`${compared ? 'Remove' : 'Add'} ${stay.name} ${compared ? 'from' : 'to'} comparison`}
          style={({ pressed }) => [styles.compareChip, compared && styles.compareChipActive, pressed && styles.pressed]}>
          <Ionicons name={compared ? 'checkmark' : 'git-compare-outline'} size={15} color={compared ? colors.onPrimary : colors.primaryText} />
          <Text style={[styles.compareText, compared && styles.compareTextActive]}>{compared ? 'Added' : 'Compare'}</Text>
        </Pressable>
      ) : null}

      {onToggleSaved ? (
        <Pressable
          onPress={onToggleSaved}
          accessibilityRole="button"
          accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${stay.name}${saved ? ' from' : ' to'} favourites`}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? colors.heart : colors.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: Radii.card,
    backgroundColor: colors.backgroundElement,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  compactCard: { width: 292, marginBottom: 0 },
  openButton: { flex: 1 },
  photo: { width: '100%', height: 188, borderRadius: 0 },
  compactPhoto: { height: 184 },
  info: { paddingHorizontal: 15, paddingTop: 13, paddingBottom: 15 },
  name: { ...Typography.cardTitle, color: colors.text, paddingRight: 38 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  location: { ...Typography.supporting, flexShrink: 1, color: colors.textSecondary },
  metaRow: { minHeight: 24, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...Typography.supporting, fontWeight: '600', color: colors.text },
  reviewCount: { ...Typography.metadata, color: colors.textSecondary },
  price: { ...Typography.supporting, fontWeight: '600', color: colors.text },
  perNight: { ...Typography.metadata, fontWeight: '400', color: colors.textSecondary },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  compareChip: {
    position: 'absolute',
    top: 12,
    left: 12,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
  },
  compareChipActive: { backgroundColor: colors.primary },
  compareText: { fontSize: 13, fontWeight: '600', color: colors.primaryText },
  compareTextActive: { color: colors.onPrimary },
  pressed: { opacity: 0.82 },
});
