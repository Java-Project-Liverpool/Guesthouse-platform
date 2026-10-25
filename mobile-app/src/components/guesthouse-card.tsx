import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import StayImage from '@/components/stay-image';
import { Colors, Radii, Typography } from '@/constants/theme';
import type { Stay } from '@/data/stays';

type Props = {
  stay: Stay;
  onPress: () => void;
  saved?: boolean;
  onToggleSaved?: () => void;
  compact?: boolean;
};

function formatPrice(value: number) {
  return `P${value.toLocaleString('en-US')}`;
}

export default function GuesthouseCard({ stay, onPress, saved = false, onToggleSaved, compact = false }: Props) {
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
            <Ionicons name="location-outline" size={15} color={Colors.light.textSecondary} />
            <Text style={styles.location} numberOfLines={1}>
              {[stay.city, stay.country].filter(Boolean).join(', ') || 'Botswana'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            {stay.rating !== undefined && (
              <View style={styles.rating}>
                <Ionicons name="star" size={14} color="#A96325" />
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

      {onToggleSaved ? (
        <Pressable
          onPress={onToggleSaved}
          accessibilityRole="button"
          accessibilityLabel={`${saved ? 'Remove' : 'Save'} ${stay.name}${saved ? ' from' : ' to'} favourites`}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={20} color={saved ? '#A94940' : Colors.light.text} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: Radii.card,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 16,
  },
  compactCard: { width: 292, marginBottom: 0 },
  openButton: { flex: 1 },
  photo: { width: '100%', height: 188, borderRadius: 0 },
  compactPhoto: { height: 184 },
  info: { paddingHorizontal: 15, paddingTop: 13, paddingBottom: 15 },
  name: { ...Typography.cardTitle, color: Colors.light.text, paddingRight: 38 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  location: { ...Typography.supporting, flexShrink: 1, color: Colors.light.textSecondary },
  metaRow: { minHeight: 24, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { ...Typography.supporting, fontWeight: '600', color: Colors.light.text },
  reviewCount: { ...Typography.metadata, color: Colors.light.textSecondary },
  price: { ...Typography.supporting, fontWeight: '600', color: Colors.light.text },
  perNight: { ...Typography.metadata, fontWeight: '400', color: Colors.light.textSecondary },
  saveButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFEFA',
  },
  pressed: { opacity: 0.82 },
});
