import React from 'react';
import { View, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { ContactDispatchButtons } from './ContactDispatchButtons';

export interface ContactDispatchSheetProps {
  visible: boolean;
  onClose: () => void;
  dispatchPhone?: string;
}

export const ContactDispatchSheet: React.FC<ContactDispatchSheetProps> = ({
  visible,
  onClose,
  dispatchPhone = '+12075550199',
}) => {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
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
                Contact dispatch
              </AppText>

              <AppText variant="body" tone="muted" style={styles.subtitle}>
                Need help with your jobs or signing in? Dispatch is here to assist.
              </AppText>

              <View style={styles.buttonContainer}>
                <ContactDispatchButtons dispatchPhone={dispatchPhone} />
              </View>

              <Button
                label="Cancel"
                variant="outline"
                size="md"
                onPress={onClose}
                style={styles.cancelButton}
              />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
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
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  cancelButton: {
    marginTop: 4,
  },
});
