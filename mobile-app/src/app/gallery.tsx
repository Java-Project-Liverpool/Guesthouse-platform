import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import StayImage from '@/components/stay-image';
import { getStay, type Stay } from '@/data/stays';

const colors = {
  background: '#0B0F0D',
  button: '#26332D',
  white: '#FFFFFF',
  active: '#FFFFFF',
};

export default function GalleryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const pager = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [stay, setStay] = useState<Stay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!id) return () => { active = false; };
    Promise.resolve().then(() => getStay(id))
      .then((item) => { if (active) setStay(item); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load these photos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading && id) return <SafeAreaView style={styles.screen}><ActivityIndicator color={colors.white} size="large" /></SafeAreaView>;
  if (!stay) return <SafeAreaView style={styles.screen}><View style={styles.inner}><Pressable style={styles.roundButton} onPress={() => router.back()}><Ionicons name="close" size={22} color={colors.white} /></Pressable><Text style={styles.counter}>{error || (!id ? 'This photo gallery is missing its listing.' : 'This guesthouse is unavailable.')}</Text></View></SafeAreaView>;

  // Uses the stay's gallery if it has one, otherwise just its main photo.
  // A stay with no photos shows its colour block.
  const photos: (string | undefined)[] = stay.images.length > 0 ? stay.images : [undefined];

  const pageWidth = Math.min(width, 480);
  const photoWidth = pageWidth - 40;

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  const goTo = (next: number) => {
    setIndex(next);
    pager.current?.scrollTo({ x: next * pageWidth, animated: true });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.inner}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.roundButton} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color={colors.white} />
          </Pressable>
          <Text style={styles.counter}>
            {index + 1} / {photos.length}
          </Text>
          <Pressable
            style={styles.roundButton}
            onPress={() => Share.share({ message: stay.name + ' on Dumela Stays' })}>
            <Ionicons name="share-outline" size={22} color={colors.white} />
          </Pressable>
        </View>

        {/* Swipeable photos */}
        <ScrollView
          ref={pager}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          style={styles.pager}>
          {photos.map((photo, i) => (
            <View key={i} style={[styles.page, { width: pageWidth }]}>
              <View style={[styles.photo, { width: photoWidth, backgroundColor: stay.color }]}>
                <StayImage uri={photo} color={stay.color} style={StyleSheet.absoluteFill} />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Thumbnails */}
        {photos.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbs}>
            {photos.map((photo, i) => (
              <Pressable key={i} onPress={() => goTo(i)}>
                <View
                  style={[
                    styles.thumb,
                    { backgroundColor: stay.color },
                    i === index && styles.thumbActive,
                  ]}>
                  <StayImage uri={photo} color={stay.color} style={StyleSheet.absoluteFill} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: { fontSize: 18, fontWeight: '800', color: colors.white },

  pager: { flex: 1 },
  page: { height: '100%', alignItems: 'center', justifyContent: 'center' },
  photo: { height: '80%', borderRadius: 28, overflow: 'hidden' },
  photoImage: { ...StyleSheet.absoluteFill },

  thumbs: { paddingHorizontal: 20, paddingVertical: 20, gap: 10 },
  thumb: {
    width: 76,
    height: 64,
    borderRadius: 14,
    overflow: 'hidden',
    opacity: 0.55,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbActive: { opacity: 1, borderColor: colors.active },
});
