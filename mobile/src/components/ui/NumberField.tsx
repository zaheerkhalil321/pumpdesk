import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export interface NumberFieldProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix: string; // e.g. "yd³", "ft"
  placeholder?: string;
  helperText?: string;
  error?: string;
  allowDecimals?: boolean;
  inline?: boolean; // compact row: label on the left, small box on the right
  containerStyle?: ViewStyle;
}

export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChangeText,
  suffix,
  placeholder = '0',
  helperText,
  error,
  allowDecimals = false,
  inline = false,
  containerStyle,
}) => {
  const { colors, heights, radius, spacing, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    if (!allowDecimals) {
      cleaned = cleaned.replace(/\./g, '');
    } else {
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
      }
    }
    onChangeText(cleaned);
  };

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  const field = (
    <View
      style={[
        styles.box,
        inline ? styles.boxInline : null,
        {
          height: inline ? heights.smButton : heights.input,
          borderRadius: radius.md,
          borderColor: getBorderColor(),
          backgroundColor: colors.surface,
          paddingHorizontal: inline ? spacing.md : spacing.base,
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            color: colors.foreground,
            ...(inline ? typography.bodyStrong : typography.value),
          },
        ]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={allowDecimals ? 'decimal-pad' : 'number-pad'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        accessibilityLabel={label}
      />
      <View style={styles.suffixContainer}>
        <AppText variant={inline ? 'small' : 'bodyStrong'} tone="muted">
          {suffix}
        </AppText>
      </View>
    </View>
  );

  const bottomText = error ? (
    <AppText variant="small" tone="danger" style={styles.bottomText}>
      {error}
    </AppText>
  ) : helperText ? (
    <AppText variant="small" tone="muted" style={styles.bottomText}>
      {helperText}
    </AppText>
  ) : null;

  if (inline) {
    return (
      <View style={[styles.wrapperInline, containerStyle]}>
        <View style={styles.inlineRow}>
          <AppText variant="small" tone="default" style={styles.inlineLabel}>
            {label}
          </AppText>
          {field}
        </View>
        {bottomText}
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <AppText variant="small" tone="default" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      {field}
      {bottomText}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  wrapperInline: {
    width: '100%',
    marginBottom: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineLabel: {
    flex: 1,
  },
  label: {
    marginBottom: 6,
    fontWeight: '600',
  },
  boxInline: {
    width: 128,
  },
  box: {
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: 0,
  },
  suffixContainer: {
    paddingLeft: 8,
  },
  bottomText: {
    marginTop: 4,
  },
});
