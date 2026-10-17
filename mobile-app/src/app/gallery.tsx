import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
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

import { useStays } from '@/data/stays';

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
  const { stays } = useStays();
  const pager = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const stay = stays.find((item) => item.id === id) ?? stays[0];
  if (!stay) return null;

  // Uses the stay's gallery if it has one, otherwise just its main photo.
  // A stay with no photos shows its colour block.
  const gallery = (stay as { images?: string[] }).images;
  const photos: (string | undefined)[] =
    gallery && gallery.length > 0 ? gallery : [stay.image];

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
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.photoImage} resizeMode="cover" />
                ) : null}
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
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.photoImage} resizeMode="cover" />
                  ) : null}
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