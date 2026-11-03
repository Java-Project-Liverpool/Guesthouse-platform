import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

function optUri(uri?: string) {
  if (!uri) return uri;
  if (uri.includes('cloudinary.com')) return uri.replace('/upload/', '/upload/w_600,q_auto,f_auto/');
  return uri;
}
export default function StayImage({
  uri,
  color,
  style,
}: {
  uri?: string;
  color?: string;
  style: object;
}) {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.fallback, style, { backgroundColor: color ?? colors.chip }]}>
      {uri && !failed ? (
        <Image
          source={{ uri: optUri(uri) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
          onError={() => setFailed(true)}
          accessibilityLabel="Guesthouse photograph"
        />
      ) : (
        <Ionicons name="home-outline" size={32} color="#FFFFFFB8" />
      )}
    </View>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({ fallback: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' } });
