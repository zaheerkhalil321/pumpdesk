import React from 'react';
import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'outline' | 'link';
export type ButtonSize = 'lg' | 'md' | 'sm';
export type ButtonOutlineTone = 'primary' | 'link';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  outlineTone?: ButtonOutlineTone; // border and text colour of the outline variant
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  caption?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  outlineTone = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  testID,
  accessibilityLabel,
  caption,
}) => {
  const { colors, heights, radius, spacing } = useTheme();

  const handlePress = () => {
    if (disabled || loading || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const getHeight = () => {
    if (variant === 'link') return undefined;
    switch (size) {
      case 'sm':
        return heights.smButton;
      case 'md':
        return heights.secondaryButton;
      case 'lg':
      default:
        return heights.primaryButton;
    }
  };

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    if (variant === 'link') {
      return {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        minHeight: heights.minTouchTarget,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: pressed ? 0.7 : 1,
      };
    }

    const base: ViewStyle = {
      height: getHeight(),
      borderRadius: radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.base,
      minHeight: heights.minTouchTarget,
      transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
    };

    if (disabled) {
      if (variant === 'primary') {
        return {
          ...base,
          backgroundColor: colors.primary,
          opacity: 0.55,
          borderWidth: 0,
        };
      }
      return {
        ...base,
        backgroundColor: colors.disabled,
        borderWidth: 0,
      };
    }

    if (variant === 'primary') {
      return {
        ...base,
        backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        borderWidth: 0,
      };
    }

    // outline
    return {
      ...base,
      backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
      borderWidth: 1.5,
      borderColor: outlineTone === 'link' ? colors.link : colors.primary,
    };
  };

  const getTextColorTone = () => {
    if (disabled && variant !== 'primary') return 'disabled';
    if (variant === 'primary') return 'primaryForeground';
    if (variant === 'link') return 'link';
    return outlineTone === 'link' ? 'link' : 'primary';
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [getContainerStyle(pressed), style]}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || label}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator
            color={
              variant === 'primary' ? colors.primaryForeground : colors.primary
            }
          />
        ) : (
          <View style={styles.contentRow}>
            {leftIcon ? <View style={styles.iconLeft}>{leftIcon}</View> : null}
            <AppText
              variant="button"
              tone={getTextColorTone()}
              style={styles.buttonLabel}
            >
              {label}
            </AppText>
            {rightIcon ? <View style={styles.iconRight}>{rightIcon}</View> : null}
          </View>
        )}
      </Pressable>
      {caption ? (
        <AppText variant="caption" tone="muted" style={styles.captionText}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  buttonLabel: {
    textAlign: 'center',
  },
  captionText: {
    textAlign: 'center',
    marginTop: 6,
  },
});
