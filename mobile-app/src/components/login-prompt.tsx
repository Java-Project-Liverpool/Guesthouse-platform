import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';


import { useAppColors, useThemedStyles } from '@/hooks/use-app-colors';
import type { AppPalette } from '@/constants/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

// Bottom sheet shown when a guest tries to save a stay or write a review
export default function LoginPrompt({ visible, onClose }: Props) {
  const colors = useAppColors();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();

  const goToLogin = () => {
    onClose();
    router.push('/login');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Inner pressable stops taps on the sheet from closing it */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.iconTile}>
            <Ionicons name="heart-outline" size={24} color={colors.primaryText} />
          </View>
          <Text style={styles.title}>Log in to save this stay</Text>
          <Text style={styles.body}>Favourites and ratings are for logged-in customers.</Text>

          <Pressable style={styles.primaryButton} onPress={goToLogin}>
            <Text style={styles.primaryText}>Log in or sign up</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={onClose}>
            <Text style={styles.outlineText}>Not now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const makeStyles = (colors: AppPalette) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8 },
  body: { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 24 },
  primaryButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: colors.onPrimary },
  outlineButton: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontSize: 16, fontWeight: '700', color: colors.primaryText },
});