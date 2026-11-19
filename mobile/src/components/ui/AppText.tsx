import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import { TypographyVariant } from '@/theme/typography';

export type TextTone =
  | 'default'
  | 'muted'
  | 'heading'
  | 'primary'
  | 'primaryText'
  | 'link'
  | 'danger'
  | 'warning'
  | 'navyForeground'
  | 'primaryForeground'
  | 'disabled';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  tone = 'default',
  style,
  children,
  maxFontSizeMultiplier = 1.4,
  ...props
}) => {
  const { colors, typography } = useTheme();

  const getToneColor = (): string => {
    switch (tone) {
      case 'muted':
        return colors.mutedForeground;
      case 'heading':
        return colors.heading;
      case 'primary':
        return colors.primary;
      case 'primaryText':
        return colors.primaryText;
      case 'link':
        return colors.link;
      case 'danger':
        return colors.danger;
      case 'warning':
        return colors.warning;
      case 'navyForeground':
        return colors.navyForeground;
      case 'primaryForeground':
        return colors.primaryForeground;
      case 'disabled':
        return colors.disabledForeground;
      case 'default':
      default:
        return colors.foreground;
    }
  };

  const textStyle: TextStyle = {
    ...typography[variant],
    color: getToneColor(),
  };

  return (
    <Text
      style={[textStyle, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...props}
    >
      {children}
    </Text>
  );
};
