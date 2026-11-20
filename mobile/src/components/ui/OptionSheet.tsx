import React from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface OptionSheetProps<T extends string> {
  visible: boolean;
  title: string;
  options: { value: T; label: string; destructive?: boolean }[];
  /** Leave out for an action list (no check mark). */
  selected?: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

/** Bottom sheet with a single-choice list. */
export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
            {title}
          </AppText>
          {options.map((option) => {
            const isSelected = option.value === selected;
            return (
              <Pressable
                key={option.value}
                onPress={() => onSelect(option.value)}
                accessibilityRole={selected === undefined ? 'button' : 'radio'}
                accessibilityState={selected === undefined ? undefined : { selected: isSelected }}
                style={[
                  styles.option,
                  {
                    borderRadius: radius.lg,
                    backgroundColor: isSelected ? colors.primarySoft : 'transparent',
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.optionText,
                    {
                      color: option.destructive
                        ? colors.danger
                        : isSelected
                          ? colors.primary
                          : colors.heading,
                    },
                  ]}
                >
                  {option.label}
                </AppText>
                {isSelected ? <Check size={20} color={colors.primary} strokeWidth={2.6} /> : null}
              </Pressable>
            );
          })}
          <Button label="Cancel" variant="link" onPress={onClose} style={styles.cancel} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

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
    marginBottom: 12,
  },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  optionText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
  },
  cancel: {
    marginTop: 8,
  },
});
