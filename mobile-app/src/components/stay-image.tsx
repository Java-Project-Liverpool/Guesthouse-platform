import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

export default function StayImage({
  uri,
  color,
  style,
}: {
  uri?: string;
  color: string;
  style: object;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={[styles.fallback, style, { backgroundColor: color }]}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
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
