import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { AppText, Button } from '@/components/ui';
import { fromPickerDate, toPickerDate } from '@/lib/dates';

export interface TimePickerSheetProps {
  visible: boolean;
  title: string;
  initialTime?: string | null;
  timeZone?: string; // the job's time zone; the picker shows and saves times in it
  onSave: (isoTime: string) => void;
  onClose: () => void;
  error?: string;
}

export const TimePickerSheet: React.FC<TimePickerSheetProps> = ({
  visible,
  title,
  initialTime,
  timeZone,
  onSave,
  onClose,
  error,
}) => {
  const { colors, radius, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    toPickerDate(initialTime, timeZone)
  );

  if (!visible) return null;

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleNow = () => {
    const now = new Date();
    setSelectedDate(toPickerDate(now, timeZone));
    onSave(now.toISOString());
  };

  const handleSave = () => {
    onSave(fromPickerDate(selectedDate, timeZone));
  };

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
                {title}
              </AppText>

              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  value={selectedDate}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleChange}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
              </View>

              {error ? (
                <AppText variant="small" tone="danger" style={styles.errorText}>
                  {error}
                </AppText>
              ) : null}

              <View style={styles.buttonsGroup}>
                <View style={styles.buttonCell}>
                  <Button label="Now" variant="outline" size="md" onPress={handleNow} />
                </View>
                <View style={styles.buttonCell}>
                  <Button label="Save" variant="primary" size="md" onPress={handleSave} />
                </View>
              </View>

              <Button
                label="Cancel"
                variant="link"
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
  pickerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonsGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  buttonCell: {
    flex: 1,
  },
  cancelButton: {
    marginTop: 8,
  },
});
