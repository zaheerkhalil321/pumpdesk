import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { formatUsPhone, extractDigits } from '@/lib/phone';
import { AppText } from './AppText';

export interface PhoneFieldProps {
  label?: string;
  value: string;
  onChangeText: (formatted: string, rawDigits: string) => void;
  helperText?: string;
  error?: string;
  placeholder?: string;
  containerStyle?: ViewStyle;
  editable?: boolean;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  label = 'Mobile number',
  value,
  onChangeText,
  helperText = 'Use the number your company has on file.',
  error,
  placeholder = '(555) 123-4567',
  containerStyle,
  editable = true,
}) => {
  const { colors, heights, radius, spacing, typography, iconSizes } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    const raw = extractDigits(text).slice(0, 10);
    const formatted = formatUsPhone(raw);
    onChangeText(formatted, raw);
  };

  const getBorderColor = () => {
    if (error) return colors.danger;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <AppText variant="small" tone="default" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.container,
          {
            height: heights.input,
            borderRadius: radius.md,
            borderColor: getBorderColor(),
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View
          style={[
            styles.countryPill,
            {
              borderRightColor: colors.border,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <AppText variant="body" tone="default" style={styles.countryCode}>
            US +1
          </AppText>
          <ChevronDown
            size={iconSizes.sm}
            color={colors.mutedForeground}
            strokeWidth={iconSizes.strokeWidth}
          />
        </View>

        <TextInput
          style={[
            styles.input,
            {
              color: colors.foreground,
              ...typography.body,
              paddingHorizontal: spacing.md,
            },
          ]}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          autoComplete="tel"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={editable}
        />
      </View>

      {error ? (
        <AppText variant="small" tone="danger" style={styles.bottomText}>
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="small" tone="muted" style={styles.bottomText}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontFamily: fontFamilies.semibold,
    marginBottom: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    width: '100%',
    overflow: 'hidden',
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    height: '100%',
  },
  countryCode: {
    marginRight: 4,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  bottomText: {
    marginTop: 4,
  },
});
