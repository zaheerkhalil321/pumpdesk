import React from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Camera, Trash2 } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface PhotoViewerProps {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
  onChange: () => void;
  onRemove: () => void;
}

/** The whole profile photo on a dark screen, at its own size and shape. */
export const PhotoViewer: React.FC<PhotoViewerProps> = ({ uri, visible, onClose, onChange, onRemove }) => {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  if (!uri) return null;

  const action = (label: string, Icon: typeof Camera, onPress: () => void, color: string) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.action, { borderColor: colors.navyForeground, borderRadius: radius.full }]}
    >
      <Icon size={18} color={color} strokeWidth={2.2} />
      <AppText style={[styles.actionText, { color }]}>{label}</AppText>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} transparent>
      <View style={[styles.screen, { backgroundColor: colors.navy, paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
          hitSlop={10}
          style={styles.close}
        >
          <X size={26} color={colors.navyForeground} strokeWidth={2.2} />
        </Pressable>

        <Image source={{ uri }} style={styles.photo} contentFit="contain" />

        <View style={styles.actions}>
          {action('Change', Camera, onChange, colors.navyForeground)}
          {action('Remove', Trash2, onRemove, colors.danger)}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  close: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  photo: {
    flex: 1,
    marginHorizontal: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 16,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    minHeight: 48,
    borderWidth: 1,
  },
  actionText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
  },
});
