import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  subLabel?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  onToggle,
  subLabel,
  disabled = false,
  style,
}) => {
  const { colors, radius } = useTheme();

  const handlePress = () => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});
    onToggle(!checked);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, style]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={`${label}${subLabel ? `, ${subLabel}` : ''}`}
    >
      <View
        style={[
          styles.box,
          {
            borderRadius: radius.sm,
            borderColor: checked ? colors.primary : colors.border,
            backgroundColor: checked ? colors.primary : colors.surface,
          },
        ]}
      >
        {checked ? (
          <Check size={16} color={colors.primaryForeground} strokeWidth={2.5} />
        ) : null}
      </View>
      <View style={styles.textContainer}>
        <AppText variant="body" tone={disabled ? 'muted' : 'default'} style={styles.label}>
          {label}
        </AppText>
        {subLabel ? (
          <AppText variant="small" tone="muted">
            {subLabel}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 8,
    width: '100%',
  },
  box: {
    width: 24,
    height: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    lineHeight: 22,
  },
});
