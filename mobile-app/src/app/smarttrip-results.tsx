import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StayImage from '@/components/stay-image';
import { Radii, Typography, type AppPalette } from '@/constants/theme';
import { toggleCompareStay, useComparison } from '@/data/comparison';
import { useFavourites } from '@/data/favourites';
import { useAuth } from '@/data/auth';
import {
  buildItinerary,
  computeBreakdown,
  type Candidate,
  type ItineraryItem,
  type TripInput,
} from '@/data/smarttrip-engine';
import { getLastPlan } from '@/data/smarttrip';
import { suggestAlternatives } from '@/data/smarttrip-alternatives';
import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import { useStays } from '@/data/stays';
import { useTabBarPadding } from '@/hooks/use-tab-bar-padding';
import { formatPula } from '@/utils/currency';

type Days = { day: number; title: string; items: ItineraryItem[] }[];

const EXPENSE_ROWS = [
  { key: 'transport', label: 'Transport' },
  { key: 'food', label: 'Food' },
  { key: 'activities', label: 'Activities' },
  { key: 'other', label: 'Other' },
] as const;

function AlternativeSection({ alternatives, input, router, styles }: { alternatives: any[]; input: any; router: any; styles: Styles }) {
  if (alternatives.length === 0 || !input) return null;
  return (
    <View style={styles.altSection}>
      <Text style={styles.altTitle}>Alternative recommendations</Text>
      <Text style={styles.altBody}>We could not match everything exactly. These small changes unlock real stays from the backend.</Text>
      {alternatives.map((alt) => (
        <View key={alt.label} style={styles.altCard}>
          <View style={styles.altHeader}>
            <Text style={styles.altLabel}>{alt.label}</Text>
          </View>
          <Text style={styles.altExplanation}>{alt.explanation}</Text>
          {alt.candidates.length > 0 && (
            <>
              <Text style={styles.altSub}>Available under this change:</Text>
              <View style={styles.altList}>
                {alt.candidates.map((c) => (
                  <Pressable key={c.stay.id} onPress={() => router.push({ pathname: '/smarttrip', params: { destination: input.destination, stayId: c.stay.id } })} accessibilityRole="button" style={styles.altItem}>
                    <Text style={styles.altItemName}>{c.stay.name}</Text>
                    <Text style={styles.altItemPrice}>{formatPula(c.nightly)} / night · {formatPula(c.accommodationCost)} total</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
          <Pressable onPress={() => router.push({ pathname: '/smarttrip', params: { destination: input.destination, budget: String(Math.round(input.budget * (alt.scoreCloseness < 0.25 ? 1.2 : 1))) } })} accessibilityRole="button" style={styles.altApplyButton}>
            <Text style={styles.altApplyText}>Try this change</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function ResultsFrame({ children, styles, tabBarPadding, header }: { children: ReactNode; styles: Styles; tabBarPadding: number; header: ReactNode }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding + 24 }]} showsVerticalScrollIndicator={false}>
        {header}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

type Styles = ReturnType<typeof makeStyles>;

export default function SmartTripResultsScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const tabBarPadding = useTabBarPadding();
  const { stayId } = useLocalSearchParams<{ stayId?: string }>();
  const { user } = useAuth();
  const { saved, toggleSaved } = useFavourites();
  const catalogue = useStays();
  const { has: isInComparison } = useComparison();
  const plan = getLastPlan();

  const [choice, setChoice] = useState<string | null>(null);
  const [estimates, setEstimates] = useState<Record<string, string>>(() => ({
    transport: String(plan?.input.transportEstimate ?? ''),
    food: String(plan?.input.foodPerPersonPerDay ?? ''),
    activities: String(plan?.input.activityPerPersonPerDay ?? ''),
    other: String(plan?.input.otherEstimate ?? ''),
  }));
  const [edited, setEdited] = useState<Record<string, Days>>({});
  const [message, setMessage] = useState('');

  const ok = plan?.result.status === 'ok' ? plan.result : null;
  const input = plan?.input;
  const nights = ok ? ok.days - 1 : 0;
  const candidates: Candidate[] = useMemo(
    () => (plan?.result.status === 'ok' ? plan.result.candidates : []),
    [plan]
  );
  const alternatives = useMemo(() => {
    if (!plan || !input) return [];
    if (plan.result.status === 'ok' && candidates.length >= 2) return [];
    const nightsValue = nightsBetween(input.arrival, input.departure) ?? 2;
    const stays = catalogue.stays || [];
    if (stays.length === 0) return [];
    return suggestAlternatives(stays, input, nightsValue);
  }, [plan, input, catalogue.stays, candidates.length]);
  const defaultId = candidates.find((c) => c.stay.id === stayId)?.stay.id ?? candidates[0]?.stay.id ?? null;
  const selectedId = candidates.some((c) => c.stay.id === choice) ? choice : defaultId;
  const selected = candidates.find((c) => c.stay.id === selectedId) ?? candidates[0];

  const generated: Days = useMemo(
    () => (selected && input ? buildItinerary(selected.stay.name, selected.stay.city, nights, input.interests) : []),
    [selected, input, nights]
  );
  const days: Days = (selectedId && edited[selectedId]) || generated;
  const setDays = (updater: (current: Days) => Days) => {
    if (!selectedId) return;
    setEdited((prev) => ({ ...prev, [selectedId]: updater(prev[selectedId] ?? generated) }));
  };

  const breakdown = useMemo(() => {
    if (!selected || !input) return null;
    const parsed = (key: keyof typeof estimates) => {
      const value = Number(estimates[key]);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    };
    const tuned: TripInput = {
      ...input,
      transportEstimate: parsed('transport'),
      foodPerPersonPerDay: parsed('food'),
      activityPerPersonPerDay: parsed('activities'),
      otherEstimate: parsed('other'),
    };
    return computeBreakdown(tuned, selected.breakdown.accommodation);
  }, [selected, input, estimates]);

  const Header = (
    <View style={styles.header}>
      <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
        <Ionicons name="chevron-back" size={22} color={colors.primaryText} />
      </Pressable>
      <Text style={styles.headerTitle}>Your trip plan</Text>
      <View style={styles.iconSpacer} />
    </View>
  );


  if (!plan || !input) {
    return (
      <ResultsFrame styles={styles} tabBarPadding={tabBarPadding} header={Header}>
        <View style={styles.card}>
          <Text style={styles.title}>No trip plan yet</Text>
          <Text style={styles.body}>Plan a trip first, then your recommendations will appear here.</Text>
          <Pressable onPress={() => router.replace('/smarttrip')} accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.primaryText}>Plan a trip</Text>
          </Pressable>
        </View>
      </ResultsFrame>
    );
  }

  const result = plan.result;
  if (result.status !== 'ok') {
    const explanations: Record<string, { title: string; body: string }> = {
      invalid: { title: 'Please check your trip details', body: result.status === 'invalid' ? result.errors.join(' ') : '' },
      'no-destination': { title: `No guesthouses in ${input.destination}`, body: 'Dumela Stays has no listings for this destination yet. Try another town from the list.' },
      'no-priced-stays': { title: 'No priced guesthouses', body: `The listings in ${input.destination} do not have prices yet, so accommodation costs cannot be calculated.` },
      'no-required-amenities': { title: 'No stay has every must-have amenity', body: result.status === 'no-required-amenities' ? `None of the listings in ${input.destination} include: ${result.required.join(', ')}. Remove a must-have amenity to see options.` : '' },
      'budget-too-low': { title: 'This budget is too low', body: result.status === 'budget-too-low' ? `The lowest-cost option (${result.cheapest}) needs about ${formatPula(result.minimumBudget)} in total, which is ${formatPula(result.shortfall)} more than your budget. Increase the budget or reduce the estimates.` : '' },
    };
    const info = explanations[result.status] ?? { title: 'No plan generated', body: '' };
    return (
      <ResultsFrame styles={styles} tabBarPadding={tabBarPadding} header={Header}>
        <View style={styles.card}>
          <Text style={styles.title}>{info.title}</Text>
          <Text style={styles.body}>{info.body}</Text>
          <AlternativeSection alternatives={alternatives} input={input} router={router} styles={styles} />
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.primaryButton}>
            <Text style={styles.primaryText}>Change my trip details</Text>
          </Pressable>
        </View>
      </ResultsFrame>
    );
  }

  const toggleFavourite = (stay: Candidate['stay']) => {
    if (!user) {
      router.push('/login');
      return;
    }
    void toggleSaved(stay.id, stay).catch(() => setMessage('Could not update favourites. Try again.'));
  };

  const compare = (stay: Candidate['stay']) => {
    const outcome = toggleCompareStay(stay);
    setMessage(outcome === 'full' ? 'Comparison is full (3 stays). Remove one first.' : outcome === 'added' ? `${stay.name} added to comparison.` : `${stay.name} removed from comparison.`);
  };

  const totalPlanned = breakdown
    ? breakdown.accommodation + breakdown.transport + breakdown.food + breakdown.activities + breakdown.other
    : 0;
  const overspend = breakdown !== null && breakdown.remaining < 0;
  const share = (value: number) => (input.budget > 0 ? Math.min(100, Math.max(0, (value / input.budget) * 100)) : 0);

  return (
    <ResultsFrame styles={styles} tabBarPadding={tabBarPadding} header={Header}>
      <View style={styles.summary}>
        <Text style={styles.eyebrow}>{input.destination}</Text>
        <Text style={styles.title}>{result.days - 1} nights · {input.adults + input.children} traveller{input.adults + input.children === 1 ? '' : 's'}</Text>
        <Text style={styles.body}>Budget {formatPula(input.budget)} · {input.transport === 'personal' ? 'Personal vehicle' : input.transport === 'public' ? 'Public transport' : input.transport === 'rental' ? 'Rental vehicle' : 'Other transport'}</Text>
        <Text style={styles.disclaimer}>Accommodation uses each guesthouse listed nightly rate. Other costs are editable estimates, not bookings.</Text>
      </View>

      {message !== '' && (
        <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text>
      )}
      {(result.excludedUnpriced > 0 || result.excludedBudget > 0) && (
        <Text style={styles.hint}>
          {result.excludedUnpriced > 0 ? `${result.excludedUnpriced} stay${result.excludedUnpriced === 1 ? ' has' : 's have'} no listed price and ${result.excludedUnpriced === 1 ? 'was' : 'were'} not ranked. ` : ''}
          {result.excludedBudget > 0 ? `${result.excludedBudget} stay${result.excludedBudget === 1 ? ' is' : 's are'} too expensive for this budget.` : ''}
        </Text>
      )}

      <Text style={styles.section}>Recommended stays</Text>
      {candidates.map((c) => {
        const isSelected = selected?.stay.id === c.stay.id;
        const isSaved = saved.includes(c.stay.id);
        const isCompare = isInComparison(c.stay.id);
        return (
          <View key={c.stay.id} style={[styles.stayCard, isSelected && styles.stayCardSelected]}>
            <StayImage uri={c.stay.image} color={c.stay.color} style={styles.stayImage} />
            <View style={styles.stayBody}>
              <View style={styles.labelRow}>
                {c.labels.map((label) => (
                  <View key={label} style={styles.labelChip}><Text style={styles.labelChipText}>{label}</Text></View>
                ))}
                {c.stay.verified && <Text style={styles.verified}>Verified</Text>}
              </View>
              <Text style={styles.stayName}>{c.stay.name}</Text>
              <Text style={styles.body}>{c.stay.city}</Text>
              <Text style={styles.price}>{formatPula(c.nightly)} / night · {formatPula(c.accommodationCost)} for {nights} night{nights === 1 ? '' : 's'}</Text>
              <Text style={styles.hint}>
                {c.stay.rating !== undefined && c.stay.ratings ? `Rated ${c.stay.rating.toFixed(1)}/5 from ${c.stay.ratings} review${c.stay.ratings === 1 ? '' : 's'}` : 'No reviews yet'}
              </Text>
              <Text style={styles.match}>Match score {Math.round(c.score * 100)}%</Text>
              {c.reasons.slice(0, 3).map((reason) => <Text key={reason} style={styles.reason}>• {reason}</Text>)}
              {c.missingOptional.length > 0 && (
                <Text style={styles.hint}>Not listed: {c.missingOptional.join(', ')}</Text>
              )}
              <View style={styles.actions}>
                <Pressable onPress={() => setChoice(c.stay.id)} accessibilityRole="button" style={[styles.actionPrimary, isSelected && styles.actionActive]}>
                  <Text style={[styles.actionPrimaryText, isSelected && styles.actionActiveText]}>{isSelected ? 'Selected for my trip' : 'Use for my trip'}</Text>
                </Pressable>
                <Pressable onPress={() => router.push({ pathname: '/details', params: { id: c.stay.id } })} accessibilityRole="button" style={styles.action}>
                  <Text style={styles.actionText}>Details</Text>
                </Pressable>
                <Pressable onPress={() => toggleFavourite(c.stay)} accessibilityRole="button" accessibilityState={{ selected: isSaved }} style={styles.action}>
                  <Text style={styles.actionText}>{isSaved ? 'Saved' : 'Save'}</Text>
                </Pressable>
                <Pressable onPress={() => compare(c.stay)} accessibilityRole="button" style={styles.action}>
                  <Text style={styles.actionText}>{isCompare ? 'In comparison' : 'Compare'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        );
      })}

      {breakdown && selected && (
        <>
          <Text style={styles.section}>Budget for {selected.stay.name}</Text>
          <View style={styles.card}>
            <View style={styles.barTrack}>
              <View style={[styles.barSegment, { width: `${share(breakdown.accommodation)}%`, backgroundColor: colors.primary }]} />
              <View style={[styles.barSegment, { width: `${share(breakdown.transport)}%`, backgroundColor: colors.secondary }]} />
              <View style={[styles.barSegment, { width: `${share(breakdown.food)}%`, backgroundColor: colors.primaryLight }]} />
              <View style={[styles.barSegment, { width: `${share(breakdown.activities)}%`, backgroundColor: colors.info }]} />
              <View style={[styles.barSegment, { width: `${share(breakdown.other)}%`, backgroundColor: colors.textMuted }]} />
            </View>
            <Text style={styles.hint}>{Math.round((totalPlanned / input.budget) * 100)}% of your budget planned</Text>

            <View style={styles.row}>
              <View style={styles.swatchRow}><View style={[styles.swatch, { backgroundColor: colors.primary }]} /><Text style={styles.rowLabel}>Accommodation (listed price)</Text></View>
              <Text style={styles.rowValue}>{formatPula(breakdown.accommodation)}</Text>
            </View>
            {EXPENSE_ROWS.map((row) => (
              <View key={row.key} style={styles.editRow}>
                <Text style={styles.rowLabel}>{row.label} (estimate)</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.currency}>P</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={estimates[row.key] ?? ''}
                    onChangeText={(text) => setEstimates((current) => ({ ...current, [row.key]: text }))}
                    keyboardType="numeric"
                    accessibilityLabel={`${row.label} estimate in Botswana Pula`}
                  />
                </View>
              </View>
            ))}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Remaining</Text>
              <Text style={[styles.rowValue, overspend && { color: colors.error }]}>{formatPula(breakdown.remaining)}</Text>
            </View>
            {overspend && (
              <Text style={styles.warning}>Planned costs are {formatPula(-breakdown.remaining)} over your budget. Lower an estimate or increase the budget.</Text>
            )}
          </View>

          <Text style={styles.section}>Suggested itinerary</Text>
          <Text style={styles.disclaimer}>These are suggestions, not confirmed bookings. Check opening hours and prices yourself, then edit or add your own.</Text>
          {days.map((day, dayIndex) => (
            <View key={day.day} style={styles.card}>
              <Text style={styles.dayTitle}>Day {day.day} · {day.title}</Text>
              {day.items.map((item, itemIndex) => (
                <View key={`${dayIndex}-${itemIndex}`} style={styles.itemRow}>
                  <Text style={styles.slot}>{item.slot}</Text>
                  <TextInput
                    style={styles.itemInput}
                    value={item.text}
                    multiline
                    onChangeText={(text) => setDays((current) => current.map((d, di) => di !== dayIndex ? d : { ...d, items: d.items.map((it, ii) => ii === itemIndex ? { ...it, text } : it) }))}
                    accessibilityLabel={`${item.slot} activity on day ${day.day}`}
                  />
                  <View style={styles.itemControls}>
                    <Pressable onPress={() => setDays((current) => current.map((d, di) => di !== dayIndex || itemIndex === 0 ? d : { ...d, items: swap(d.items, itemIndex, itemIndex - 1) }))} accessibilityRole="button" accessibilityLabel="Move up" style={styles.iconSmall}>
                      <Ionicons name="arrow-up" size={16} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable onPress={() => setDays((current) => current.map((d, di) => di !== dayIndex || itemIndex === d.items.length - 1 ? d : { ...d, items: swap(d.items, itemIndex, itemIndex + 1) }))} accessibilityRole="button" accessibilityLabel="Move down" style={styles.iconSmall}>
                      <Ionicons name="arrow-down" size={16} color={colors.textSecondary} />
                    </Pressable>
                    <Pressable onPress={() => setDays((current) => current.map((d, di) => di !== dayIndex ? d : { ...d, items: d.items.filter((_, ii) => ii !== itemIndex) }))} accessibilityRole="button" accessibilityLabel="Remove activity" style={styles.iconSmall}>
                      <Ionicons name="trash-outline" size={16} color={colors.error} />
                    </Pressable>
                  </View>
                </View>
              ))}
              <Pressable onPress={() => setDays((current) => current.map((d, di) => di !== dayIndex ? d : { ...d, items: [...d.items, { slot: 'Your activity', text: '' }] }))} accessibilityRole="button" style={styles.addButton}>
                <Ionicons name="add" size={16} color={colors.primaryText} />
                <Text style={styles.addText}>Add an activity</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      <View style={styles.bottomActions}>
        <Pressable onPress={() => router.push('/compare')} accessibilityRole="button" style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Open comparison</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.primaryButton}>
          <Text style={styles.primaryText}>Change budget or preferences</Text>
        </Pressable>
      </View>
    </ResultsFrame>
  );
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip },
  iconSpacer: { width: 44, height: 44 },
  headerTitle: { ...Typography.cardTitleLarge, color: colors.text },
  summary: { padding: 18, borderRadius: Radii.card, backgroundColor: colors.primary, gap: 6 },
  eyebrow: { ...Typography.metadata, letterSpacing: 2, color: colors.secondary, fontWeight: '700', textTransform: 'uppercase' },
  title: { ...Typography.section, color: colors.onPrimary },
  body: { ...Typography.supporting, color: colors.onPrimary, opacity: 0.9 },
  section: { ...Typography.cardTitleLarge, color: colors.text, marginTop: 6 },
  card: { padding: 16, borderRadius: Radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 },
  hint: { ...Typography.supporting, color: colors.textSecondary },
  disclaimer: { ...Typography.metadata, color: colors.textMuted, lineHeight: 16 },
  message: { ...Typography.supporting, color: colors.primaryText, fontWeight: '600' },
  warning: { ...Typography.supporting, color: colors.error, fontWeight: '600' },
  altSection: { gap: 14, marginTop: 12, padding: 16, borderRadius: Radii.card, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border },
  altTitle: { ...Typography.cardTitleLarge, color: colors.text },
  altBody: { ...Typography.supporting, color: colors.textSecondary, marginTop: 4 },
  altCard: { padding: 14, borderRadius: Radii.control, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 8, marginTop: 10 },
  altHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  altLabel: { ...Typography.cardTitle, fontWeight: '700', color: colors.primaryText },
  altExplanation: { ...Typography.supporting, color: colors.textSecondary, lineHeight: 18 },
  altSub: { ...Typography.supporting, fontWeight: '700', color: colors.text, marginTop: 6 },
  altList: { gap: 8, marginTop: 6 },
  altItem: { padding: 10, borderRadius: Radii.control, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.border },
  altItemName: { ...Typography.cardTitle, color: colors.text },
  altItemPrice: { ...Typography.supporting, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  altApplyButton: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radii.pill, backgroundColor: colors.primary },
  altApplyText: { ...Typography.supporting, fontWeight: '700', color: colors.onPrimary },
  stayCard: { flexDirection: 'column', borderRadius: Radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  stayCardSelected: { borderColor: colors.primary, borderWidth: 2 },
  stayImage: { width: '100%', height: 160 },
  stayBody: { padding: 14, gap: 6 },
  labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  labelChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: Radii.pill, backgroundColor: colors.secondary },
  labelChipText: { ...Typography.metadata, fontWeight: '700', color: colors.onSecondary },
  verified: { ...Typography.metadata, fontWeight: '700', color: colors.success },
  stayName: { ...Typography.cardTitleLarge, color: colors.text },
  price: { ...Typography.supporting, fontWeight: '700', color: colors.text },
  match: { ...Typography.supporting, fontWeight: '700', color: colors.primaryText },
  reason: { ...Typography.supporting, color: colors.textSecondary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  actionPrimary: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.pill, backgroundColor: colors.primary },
  actionPrimaryText: { ...Typography.supporting, fontWeight: '700', color: colors.onPrimary },
  actionActive: { backgroundColor: colors.chip },
  actionActiveText: { color: colors.primaryText },
  action: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.pill, borderWidth: 1, borderColor: colors.border },
  actionText: { ...Typography.supporting, fontWeight: '600', color: colors.text },
  barTrack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: colors.backgroundSecondary },
  barSegment: { height: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  swatchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  rowLabel: { ...Typography.supporting, color: colors.text, flexShrink: 1 },
  rowValue: { ...Typography.cardTitle, color: colors.text, fontWeight: '700' },
  editRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: Radii.control, backgroundColor: colors.inputBackground, paddingHorizontal: 10, width: 130 },
  currency: { ...Typography.supporting, color: colors.textSecondary, marginRight: 4 },
  amountInput: { flex: 1, minHeight: 40, color: colors.text, fontSize: 15, fontWeight: '600', textAlign: 'right' },
  dayTitle: { ...Typography.cardTitle, color: colors.primaryText },
  itemRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.divider },
  slot: { ...Typography.metadata, fontWeight: '700', color: colors.textSecondary, width: 74, textTransform: 'uppercase' },
  itemInput: { flex: 1, minWidth: 140, minHeight: 40, paddingHorizontal: 10, paddingVertical: 8, borderRadius: Radii.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, fontSize: 14 },
  itemControls: { flexDirection: 'row', gap: 4 },
  iconSmall: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  addText: { ...Typography.supporting, fontWeight: '700', color: colors.primaryText },
  bottomActions: { gap: 10, marginTop: 6 },
  primaryButton: { minHeight: 52, borderRadius: Radii.control, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryText: { ...Typography.cardTitle, color: colors.onPrimary, fontWeight: '700' },
  secondaryButton: { minHeight: 52, borderRadius: Radii.control, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { ...Typography.cardTitle, color: colors.text, fontWeight: '600' },
});
