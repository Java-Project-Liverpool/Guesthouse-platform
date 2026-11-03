import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

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
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.fallback, style, { backgroundColor: color ?? '#E1E9E3' }]}>
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

const styles = StyleSheet.create({ fallback: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' } });
