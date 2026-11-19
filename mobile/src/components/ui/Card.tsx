import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

export type CardTone = 'default' | 'soft' | 'muted';

export interface CardProps {
  children: React.ReactNode;
  tone?: CardTone;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  tone = 'default',
  style,
}) => {
  const { colors, radius, spacing } = useTheme();

  const getCardStyle = (): ViewStyle => {
    switch (tone) {
      case 'soft':
        return {
          backgroundColor: colors.primarySoft,
          borderColor: colors.primarySoftBorder,
        };
      case 'muted':
        return {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        };
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radius.lg,
          padding: spacing.base,
        },
        getCardStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    width: '100%',
  },
});
