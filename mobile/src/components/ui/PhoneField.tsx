import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  Pressable,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { COUNTRIES, COUNTRY_LIST, CountryCode, formatNational, nationalDigits } from '@/lib/phone';
import { OptionSheet } from './OptionSheet';
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
  /** Country of the number; the pill on the left changes it. */
  country?: CountryCode;
  onCountryChange?: (country: CountryCode) => void;
}

export const PhoneField: React.FC<PhoneFieldProps> = ({
  label = 'Mobile number',
  value,
  onChangeText,
  helperText = 'Use the number your company has on file.',
  error,
  placeholder,
  containerStyle,
  editable = true,
  country = 'US',
  onCountryChange,
}) => {
  const { colors, heights, radius, spacing, typography, iconSizes } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const current = COUNTRIES[country];

  const handleChange = (text: string) => {
    onChangeText(formatNational(text, country), nationalDigits(text, country));
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
        <Pressable
          onPress={onCountryChange ? () => setPickerOpen(true) : undefined}
          disabled={!onCountryChange || !editable}
          accessibilityRole="button"
          accessibilityLabel={`Country: ${current.name} +${current.dial}. Change country`}
          style={[
            styles.countryPill,
            {
              borderRightColor: colors.border,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <AppText variant="body" tone="default" style={styles.countryCode}>
            {current.code} +{current.dial}
          </AppText>
          {onCountryChange ? (
            <ChevronDown
              size={iconSizes.sm}
              color={colors.mutedForeground}
              strokeWidth={iconSizes.strokeWidth}
            />
          ) : null}
        </Pressable>

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
          placeholder={placeholder ?? current.placeholder}
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
      {onCountryChange ? (
        <OptionSheet
          visible={pickerOpen}
          title="Country"
          options={COUNTRY_LIST.map((c) => ({ value: c.code, label: `${c.name} (+${c.dial})` }))}
          selected={country}
          onSelect={(code) => {
            setPickerOpen(false);
            onCountryChange(code);
          }}
          onClose={() => setPickerOpen(false)}
        />
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
