import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { AppText } from './AppText';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  ...inputProps
}) => {
  const { colors, heights, radius, spacing, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

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
          styles.box,
          {
            height: heights.input,
            borderRadius: radius.md,
            borderColor: getBorderColor(),
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.base,
          },
        ]}
      >
        {leftIcon ? <View style={styles.leftIcon}>{leftIcon}</View> : null}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.foreground,
              ...typography.body,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.mutedForeground}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...inputProps}
        />
        {rightIcon ? <View style={styles.rightIcon}>{rightIcon}</View> : null}
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
  box: {
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
  },
  bottomText: {
    marginTop: 4,
  },
});
