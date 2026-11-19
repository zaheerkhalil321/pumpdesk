import React from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AppText, Button, ListRow } from '@/components/ui';

export interface EditTimesSheetItem {
  key: string;
  label: string;
  time: string;
}

export interface EditTimesSheetProps {
  visible: boolean;
  items: EditTimesSheetItem[];
  onSelect: (key: string) => void;
  onClose: () => void;
}

export const EditTimesSheet: React.FC<EditTimesSheetProps> = ({
  visible,
  items,
  onSelect,
  onClose,
}) => {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: radius.lg,
                  borderTopRightRadius: radius.lg,
                  paddingHorizontal: spacing.screenPadding,
                  paddingBottom: insets.bottom + spacing.base,
                },
              ]}
            >
              <View style={styles.handleContainer}>
                <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
              </View>

              <AppText variant="title" tone="heading" style={styles.title}>
                Edit times
              </AppText>

              <View style={[styles.list, { borderTopColor: colors.border }]}>
                {items.map((item) => (
                  <ListRow
                    key={item.key}
                    label={item.label}
                    value={item.time}
                    onPress={() => onSelect(item.key)}
                  />
                ))}
              </View>

              <Button label="Cancel" variant="link" onPress={onClose} style={styles.cancel} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  title: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  list: {
    borderTopWidth: 1,
  },
  cancel: {
    marginTop: 8,
  },
});
