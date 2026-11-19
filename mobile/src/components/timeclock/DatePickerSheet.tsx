import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '@/components/ui';
import { useTheme } from '@/theme';

export interface DatePickerSheetProps {
  visible: boolean;
  initialDate: Date;
  maximumDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

/**
 * Pick any day to jump to its week. Uses the phone's own calendar
 * (@react-native-community/datetimepicker, already in the app): a sheet with an
 * inline calendar on iOS, the system calendar dialog on Android.
 */
export const DatePickerSheet: React.FC<DatePickerSheetProps> = ({
  visible,
  initialDate,
  maximumDate,
  onSelect,
  onClose,
}) => {
  const { colors, radius, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(initialDate);

  if (!visible) return null;

  // Android shows its own dialog; no sheet around it.
  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={initialDate}
        mode="date"
        maximumDate={maximumDate}
        onChange={(event: DateTimePickerEvent, picked?: Date) => {
          if (event.type === 'set' && picked) onSelect(picked);
          else onClose();
        }}
      />
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingHorizontal: spacing.screenPadding,
              paddingBottom: insets.bottom + spacing.base,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <AppText variant="title" tone="heading" style={styles.title}>
            Pick a day
          </AppText>
          <DateTimePicker
            value={date}
            mode="date"
            display="inline"
            maximumDate={maximumDate}
            accentColor={colors.primary}
            themeVariant={isDark ? 'dark' : 'light'}
            onChange={(_e: DateTimePickerEvent, picked?: Date) => picked && setDate(picked)}
          />
          <Button label="Show this week" variant="primary" size="lg" onPress={() => onSelect(date)} />
          <Button label="Cancel" variant="link" onPress={onClose} style={styles.cancel} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  cancel: {
    marginTop: 6,
  },
});
