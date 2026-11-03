import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radii, Typography, type AppPalette } from '@/constants/theme';
import {
  AMENITY_OPTIONS,
  ESTIMATE_DEFAULTS,
  INTEREST_OPTIONS,
  TIER_OPTIONS,
  TRANSPORT_OPTIONS,
  nightsBetween,
  planTrip,
  validateTrip,
  type Interest,
  type StayTier,
  type Transport,
  type TripInput,
} from '@/data/smarttrip-engine';
import { destinationsFrom, loadTripStays, setLastPlan } from '@/data/smarttrip';
import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import { useTabBarPadding } from '@/hooks/use-tab-bar-padding';

const STEPS = ['Trip', 'Budget', 'Preferences'] as const;

function isoDate(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toNumber(text: string) {
  const value = Number(text.replace(/[,\sP]/g, ''));
  return Number.isFinite(value) ? value : NaN;
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

type Styles = ReturnType<typeof makeStyles>;

function ChipButton({ label, active, onPress, styles }: { label: string; active: boolean; onPress: () => void; styles: Styles }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StepperControl({ label, value, min, max, onChange, styles, iconColor }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; styles: Styles; iconColor: string }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>{label}</Text>
      <View style={styles.stepControls}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} accessibilityRole="button" accessibilityLabel={`Decrease ${label}`} style={styles.stepButton}>
          <Ionicons name="remove" size={18} color={iconColor} />
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} accessibilityRole="button" accessibilityLabel={`Increase ${label}`} style={styles.stepButton}>
          <Ionicons name="add" size={18} color={iconColor} />
        </Pressable>
      </View>
    </View>
  );
}

function AmountField({ label, value, onChangeText, caption, styles, placeholderColor }: { label: string; value: string; onChangeText: (t: string) => void; caption: string; styles: Styles; placeholderColor: string }) {
  return (
    <View style={styles.amountField}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.amountRow}>
        <Text style={styles.currency}>P</Text>
        <TextInput
          style={styles.amountInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={placeholderColor}
          accessibilityLabel={`${label} in Botswana Pula`}
        />
      </View>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

export default function SmartTripScreen() {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const tabBarPadding = useTabBarPadding();
  const params = useLocalSearchParams<{ destination?: string; stayId?: string }>();

  const [stays, setStays] = useState<Awaited<ReturnType<typeof loadTripStays>>>([]);
  const [staysState, setStaysState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [staysError, setStaysError] = useState('');
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  const [destination, setDestination] = useState(params.destination ?? '');
  const [arrival, setArrival] = useState(() => isoDate(7));
  const [departure, setDeparture] = useState(() => isoDate(9));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);

  const [budgetText, setBudgetText] = useState('4500');
  const [transport, setTransport] = useState<Transport>('personal');
  const [transportText, setTransportText] = useState(String(TRANSPORT_OPTIONS[0].defaultEstimate));
  const [foodText, setFoodText] = useState(String(ESTIMATE_DEFAULTS.foodPerPersonPerDay));
  const [activityText, setActivityText] = useState(String(ESTIMATE_DEFAULTS.activityPerPersonPerDay));
  const [otherText, setOtherText] = useState(String(ESTIMATE_DEFAULTS.otherEstimate));

  const [interests, setInterests] = useState<Interest[]>(['nature', 'sightseeing']);
  const [tier, setTier] = useState<StayTier>('comfortable');
  const [required, setRequired] = useState<string[]>([]);
  const [optional, setOptional] = useState<string[]>([]);

  const loadData = (force = false) => {
    setStaysState('loading');
    loadTripStays(force)
      .then((items) => {
        setStays(items);
        setStaysState('ready');
      })
      .catch((reason: unknown) => {
        setStaysError(reason instanceof Error ? reason.message : 'Could not load guesthouses.');
        setStaysState('error');
      });
  };

  useEffect(() => {
    let active = true;
    loadTripStays()
      .then((items) => { if (active) { setStays(items); setStaysState('ready'); } })
      .catch((reason: unknown) => {
        if (active) {
          setStaysError(reason instanceof Error ? reason.message : 'Could not load guesthouses.');
          setStaysState('error');
        }
      });
    return () => { active = false; };
  }, []);

  const destinations = useMemo(() => destinationsFrom(stays), [stays]);
  const nights = nightsBetween(arrival, departure);

  const buildInput = (): TripInput => ({
    destination: destination.trim(),
    adults,
    children,
    arrival,
    departure,
    rooms,
    budget: toNumber(budgetText),
    transport,
    transportEstimate: toNumber(transportText),
    foodPerPersonPerDay: toNumber(foodText),
    activityPerPersonPerDay: toNumber(activityText),
    otherEstimate: toNumber(otherText),
    interests,
    tier,
    requiredAmenities: required,
    optionalAmenities: optional,
  });

  const stepErrors = (current: number): string[] => {
    const all = validateTrip(buildInput());
    const keywords = current === 0
      ? ['destination', 'dates', 'adult', 'room', 'Children', '30 nights']
      : ['budget', 'estimate'];
    return current === 2 ? [] : all.filter((message) => keywords.some((word) => message.includes(word)));
  };

  const goNext = () => {
    const problems = stepErrors(step);
    setErrors(problems);
    if (problems.length === 0) setStep((value) => Math.min(value + 1, STEPS.length - 1));
  };

  const submit = () => {
    const input = buildInput();
    const problems = validateTrip(input);
    setErrors(problems);
    if (problems.length > 0) {
      setStep(stepErrors(0).length > 0 ? 0 : 1);
      return;
    }
    const result = planTrip(stays, input);
    setLastPlan({ input, result });
    router.push({ pathname: '/smarttrip-results', params: params.stayId ? { stayId: params.stayId } : {} });
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding + 24 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={colors.primaryText} />
          </Pressable>
          <Text style={styles.headerTitle}>SmartTrip</Text>
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Dumela SmartTrip</Text>
          <Text style={styles.title}>Plan your Botswana trip within your budget</Text>
          <Text style={styles.body}>We rank real guesthouses for your dates, estimate your trip costs, and suggest an itinerary you can edit.</Text>
        </View>

        <View style={styles.progress}>
          {STEPS.map((label, index) => (
            <View key={label} style={styles.progressItem}>
              <View style={[styles.progressDot, index <= step && styles.progressDotActive]}>
                <Text style={[styles.progressNumber, index <= step && styles.progressNumberActive]}>{index + 1}</Text>
              </View>
              <Text style={[styles.progressLabel, index === step && styles.progressLabelActive]}>{label}</Text>
            </View>
          ))}
        </View>

        {staysState === 'loading' && (
          <View style={styles.notice}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.noticeText}>Loading guesthouses from Dumela Stays…</Text>
          </View>
        )}
        {staysState === 'error' && (
          <View style={styles.notice}>
            <Text style={styles.noticeError}>{staysError || 'Could not load guesthouses.'}</Text>
            <Pressable onPress={() => loadData(true)} accessibilityRole="button" style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {errors.length > 0 && (
          <View style={styles.errorBox}>
            {errors.map((message) => <Text key={message} style={styles.errorText}>• {message}</Text>)}
          </View>
        )}

        {step === 0 && (
          <View style={styles.card}>
            <Text style={styles.label}>Destination</Text>
            {destinations.length === 0 && staysState === 'ready' ? (
              <Text style={styles.hint}>No guesthouses are listed yet, so there are no destinations to choose from.</Text>
            ) : (
              <View style={styles.chipRow}>
                {destinations.map((city) => (
                  <ChipButton styles={styles} key={city} label={city} active={destination === city} onPress={() => setDestination(city)} />
                ))}
              </View>
            )}
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.label}>Arrival</Text>
                <TextInput style={styles.input} value={arrival} onChangeText={setArrival} placeholder="YYYY-MM-DD" placeholderTextColor={colors.placeholder} autoCapitalize="none" accessibilityLabel="Arrival date" />
              </View>
              <View style={styles.dateField}>
                <Text style={styles.label}>Departure</Text>
                <TextInput style={styles.input} value={departure} onChangeText={setDeparture} placeholder="YYYY-MM-DD" placeholderTextColor={colors.placeholder} autoCapitalize="none" accessibilityLabel="Departure date" />
              </View>
            </View>
            <Text style={styles.hint}>{nights === null ? 'Departure must be after arrival.' : `${nights} night${nights === 1 ? '' : 's'} · ${nights + 1} days`}</Text>
            <StepperControl styles={styles} iconColor={colors.primaryText} label="Adults" value={adults} min={1} max={10} onChange={setAdults} />
            <StepperControl styles={styles} iconColor={colors.primaryText} label="Children" value={children} min={0} max={10} onChange={setChildren} />
            <StepperControl styles={styles} iconColor={colors.primaryText} label="Rooms" value={rooms} min={1} max={5} onChange={setRooms} />
          </View>
        )}

        {step === 1 && (
          <View style={styles.card}>
            <AmountField styles={styles} placeholderColor={colors.placeholder} label="Total trip budget" value={budgetText} onChangeText={setBudgetText} caption="Your total for the whole trip, in Botswana Pula." />
            <Text style={styles.label}>Transport</Text>
            <View style={styles.chipRow}>
              {TRANSPORT_OPTIONS.map((option) => (
                <ChipButton styles={styles} key={option.id} label={option.label} active={transport === option.id} onPress={() => { setTransport(option.id); setTransportText(String(option.defaultEstimate)); }} />
              ))}
            </View>
            <AmountField styles={styles} placeholderColor={colors.placeholder} label="Transport estimate" value={transportText} onChangeText={setTransportText} caption="Estimate only. Edit it to match your own fuel or fare costs." />
            <AmountField styles={styles} placeholderColor={colors.placeholder} label="Food per person per day" value={foodText} onChangeText={setFoodText} caption="Planning estimate. Not a menu price." />
            <AmountField styles={styles} placeholderColor={colors.placeholder} label="Activities per person per day" value={activityText} onChangeText={setActivityText} caption="Planning estimate. Not an admission price." />
            <AmountField styles={styles} placeholderColor={colors.placeholder} label="Other expenses" value={otherText} onChangeText={setOtherText} caption="Airtime, shopping, emergencies, and so on." />
            <Text style={styles.disclaimer}>All non-accommodation figures are estimates you can change. Only accommodation uses real guesthouse prices.</Text>
          </View>
        )}

        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.label}>Interests</Text>
            <View style={styles.chipRow}>
              {INTEREST_OPTIONS.map((item) => (
                <ChipButton styles={styles} key={item.id} label={item.label} active={interests.includes(item.id)} onPress={() => setInterests((list) => toggle(list, item.id))} />
              ))}
            </View>
            <Text style={styles.label}>Accommodation style</Text>
            <View style={styles.chipRow}>
              {TIER_OPTIONS.map((item) => (
                <ChipButton styles={styles} key={item.id} label={item.label} active={tier === item.id} onPress={() => setTier(item.id)} />
              ))}
            </View>
            <Text style={styles.label}>Must have <Text style={styles.labelHint}>(stays without these are excluded)</Text></Text>
            <View style={styles.chipRow}>
              {AMENITY_OPTIONS.map((item) => (
                <ChipButton styles={styles} key={`r-${item}`} label={item} active={required.includes(item)} onPress={() => setRequired((list) => toggle(list, item))} />
              ))}
            </View>
            <Text style={styles.label}>Nice to have <Text style={styles.labelHint}>(these raise the match score)</Text></Text>
            <View style={styles.chipRow}>
              {AMENITY_OPTIONS.filter((item) => !required.includes(item)).map((item) => (
                <ChipButton styles={styles} key={`o-${item}`} label={item} active={optional.includes(item)} onPress={() => setOptional((list) => toggle(list, item))} />
              ))}
            </View>
          </View>
        )}

        <View style={styles.navRow}>
          {step > 0 ? (
            <Pressable onPress={() => { setErrors([]); setStep((value) => value - 1); }} accessibilityRole="button" style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Back</Text>
            </Pressable>
          ) : <View style={styles.navSpacer} />}
          {step < STEPS.length - 1 ? (
            <Pressable onPress={goNext} accessibilityRole="button" style={styles.primaryButton}>
              <Text style={styles.primaryText}>Next</Text>
            </Pressable>
          ) : (
            <Pressable onPress={submit} accessibilityRole="button" style={styles.primaryButton} disabled={staysState !== 'ready'}>
              <Text style={styles.primaryText}>Plan My Trip</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip },
  iconSpacer: { width: 44, height: 44 },
  headerTitle: { ...Typography.cardTitleLarge, color: colors.text },
  hero: { padding: 18, borderRadius: Radii.card, backgroundColor: colors.primary, gap: 6 },
  eyebrow: { ...Typography.metadata, letterSpacing: 2, color: colors.secondary, fontWeight: '700', textTransform: 'uppercase' },
  title: { ...Typography.section, color: colors.onPrimary },
  body: { ...Typography.supporting, color: colors.onPrimary, opacity: 0.85 },
  progress: { flexDirection: 'row', justifyContent: 'space-between' },
  progressItem: { alignItems: 'center', gap: 4, flex: 1 },
  progressDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  progressDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressNumber: { ...Typography.supporting, fontWeight: '700', color: colors.textSecondary },
  progressNumberActive: { color: colors.onPrimary },
  progressLabel: { ...Typography.metadata, color: colors.textSecondary },
  progressLabelActive: { color: colors.text, fontWeight: '700' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: Radii.control, backgroundColor: colors.backgroundSecondary, flexWrap: 'wrap' },
  noticeText: { ...Typography.supporting, color: colors.textSecondary },
  noticeError: { ...Typography.supporting, color: colors.error, flexShrink: 1 },
  retry: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radii.pill, backgroundColor: colors.primary },
  retryText: { ...Typography.supporting, fontWeight: '700', color: colors.onPrimary },
  errorBox: { padding: 12, borderRadius: Radii.control, backgroundColor: colors.backgroundSecondary, borderWidth: 1, borderColor: colors.error, gap: 4 },
  errorText: { ...Typography.supporting, color: colors.error },
  card: { padding: 16, borderRadius: Radii.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 12 },
  label: { ...Typography.supporting, fontWeight: '700', color: colors.textSecondary },
  labelHint: { fontWeight: '400', color: colors.textMuted },
  hint: { ...Typography.supporting, color: colors.textSecondary },
  disclaimer: { ...Typography.metadata, color: colors.textMuted, lineHeight: 16 },
  caption: { ...Typography.metadata, color: colors.textMuted },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radii.pill, backgroundColor: colors.chip, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...Typography.supporting, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.onPrimary },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateField: { flex: 1, gap: 6 },
  input: { minHeight: 46, paddingHorizontal: 12, borderRadius: Radii.control, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.inputBackground, color: colors.text, fontSize: 15 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepLabel: { ...Typography.cardTitle, color: colors.text },
  stepControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.chip },
  stepValue: { ...Typography.cardTitle, color: colors.text, minWidth: 20, textAlign: 'center' },
  amountField: { gap: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: Radii.control, backgroundColor: colors.inputBackground, paddingHorizontal: 12 },
  currency: { ...Typography.cardTitle, color: colors.textSecondary, marginRight: 6 },
  amountInput: { flex: 1, minHeight: 46, color: colors.text, fontSize: 16, fontWeight: '600' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  navSpacer: { flex: 1 },
  primaryButton: { flex: 1, minHeight: 52, borderRadius: Radii.control, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryText: { ...Typography.cardTitle, color: colors.onPrimary, fontWeight: '700' },
  secondaryButton: { minHeight: 52, paddingHorizontal: 22, borderRadius: Radii.control, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { ...Typography.cardTitle, color: colors.text, fontWeight: '600' },
});
