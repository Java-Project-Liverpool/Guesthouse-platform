import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Pressable } from 'react-native';

import { Radii, Typography, type AppPalette } from '@/constants/theme';
import { COMPARE_PRIORITIES, rankStays, reasonsFor, type ComparePriority } from '@/data/smartcompare';
import type { Stay } from '@/data/stays';
import { nightsBetween } from '@/data/smarttrip-engine';
import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import { formatPula } from '@/utils/currency';

function isoDate(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export default function SmartComparePanel({ stays }: { stays: Stay[] }) {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const [priority, setPriority] = useState<ComparePriority>('overall');
  const [arrival, setArrival] = useState(() => isoDate(7));
  const [departure, setDeparture] = useState(() => isoDate(10));
  const nights = nightsBetween(arrival, departure);

  const verdict = useMemo(
    () => (nights !== null && stays.length >= 2 ? rankStays(stays, nights, priority) : null),
    [stays, nights, priority]
  );

  const nameOf = (id: string | null) => stays.find((stay) => stay.id === id)?.name ?? '';
  const labels: { label: string; id: string | null }[] = verdict
    ? [
        { label: 'Best value', id: verdict.bestValueId },
        { label: 'Highest rated', id: verdict.highestRatedId },
        { label: 'Most affordable', id: verdict.mostAffordableId },
        { label: 'Best amenities', id: verdict.bestAmenitiesId },
      ].filter((item) => item.id !== null)
    : [];

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>SmartCompare</Text>
      <Text style={styles.title}>Smart verdict</Text>

      <Text style={styles.label}>What matters most to you?</Text>
      <View style={styles.chipRow}>
        {COMPARE_PRIORITIES.map((item) => {
          const active = item.id === priority;
          return (
            <Pressable
              key={item.id}
              onPress={() => setPriority(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Stay dates</Text>
      <View style={styles.dateRow}>
        <TextInput
          style={styles.input}
          value={arrival}
          onChangeText={setArrival}
          placeholder="Check-in YYYY-MM-DD"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          accessibilityLabel="Check-in date"
        />
        <TextInput
          style={styles.input}
          value={departure}
          onChangeText={setDeparture}
          placeholder="Check-out YYYY-MM-DD"
          placeholderTextColor={colors.placeholder}
          autoCapitalize="none"
          accessibilityLabel="Check-out date"
        />
      </View>
      {nights === null ? (
        <Text style={styles.warning}>Enter dates as YYYY-MM-DD with check-out after check-in.</Text>
      ) : (
        <Text style={styles.hint}>{nights} night{nights === 1 ? '' : 's'}</Text>
      )}

      {stays.length < 2 ? (
        <Text style={styles.hint}>Add at least two stays to see a verdict.</Text>
      ) : verdict ? (
        <>
          {labels.length > 0 && (
            <View style={styles.verdictList}>
              {labels.map((item) => (
                <View key={item.label} style={styles.verdictRow}>
                  <Text style={styles.verdictLabel}>{item.label}</Text>
                  <Text style={styles.verdictName} numberOfLines={2}>{nameOf(item.id)}</Text>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.label}>Ranking for “{COMPARE_PRIORITIES.find((p) => p.id === priority)?.label}”</Text>
          {verdict.ranking.map((row, index) => {
            const metric = verdict.metrics.find((m) => m.stay.id === row.stayId);
            const stay = stays.find((s) => s.id === row.stayId);
            if (!metric || !stay) return null;
            return (
              <View key={row.stayId} style={styles.rankRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankNumber}>{row.score === null ? '–' : index + 1}</Text>
                </View>
                <View style={styles.rankBody}>
                  <Text style={styles.rankName} numberOfLines={2}>{stay.name}</Text>
                  {row.score === null ? (
                    <Text style={styles.hint}>Not enough data to rank for this priority (price or rating missing).</Text>
                  ) : (
                    <>
                      <Text style={styles.hint}>
                        {metric.stayTotal !== null
                          ? `${formatPula(metric.stayTotal)} total for ${nights} night${nights === 1 ? '' : 's'}`
                          : 'Price not listed'}
                      </Text>
                      {reasonsFor(row.stayId, verdict).slice(0, 2).map((reason) => (
                        <Text key={reason} style={styles.reason}>• {reason}</Text>
                      ))}
                      <Pressable
                        onPress={() => router.push({ pathname: '/smarttrip', params: { destination: stay.city, stayId: stay.id } })}
                        accessibilityRole="button"
                        style={styles.planButton}>
                        <Text style={styles.planText}>Plan a trip with this stay</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 16, padding: 20, borderRadius: Radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 14 },
  eyebrow: { ...Typography.metadata, letterSpacing: 2, color: colors.secondary, fontWeight: '700', textTransform: 'uppercase' },
  title: { ...Typography.section, color: colors.text },
  label: { ...Typography.supporting, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radii.pill, backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...Typography.supporting, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.onPrimary },
  dateRow: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, minHeight: 44, paddingHorizontal: 12, borderRadius: Radii.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, fontSize: 14 },
  warning: { ...Typography.supporting, color: colors.error },
  hint: { ...Typography.supporting, color: colors.textSecondary },
  verdictList: { gap: 10, padding: 14, borderRadius: Radii.control, backgroundColor: colors.backgroundSecondary },
  verdictRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, paddingVertical: 6 },
  verdictLabel: { ...Typography.supporting, fontWeight: '700', color: colors.primaryText, flexShrink: 0 },
  verdictName: { ...Typography.supporting, flexShrink: 1, color: colors.text, fontWeight: '600', flexWrap: 'wrap' },
  rankRow: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.divider },
  rankBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, flexShrink: 0 },
  rankNumber: { ...Typography.supporting, fontWeight: '800', color: colors.onPrimary },
  rankBody: { flex: 1, gap: 4 },
  rankName: { ...Typography.cardTitle, color: colors.text, flexWrap: 'wrap' },
  reason: { ...Typography.supporting, color: colors.textSecondary },
  planButton: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.pill, backgroundColor: colors.primary },
  planText: { ...Typography.supporting, fontWeight: '700', color: colors.onPrimary },
});
