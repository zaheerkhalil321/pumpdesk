import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export type BadgeTone = 'primary' | 'neutral' | 'warning' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  dot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  tone = 'primary',
  dot = false,
  style,
}) => {
  const { colors, radius, spacing } = useTheme();

  const getBadgeColors = () => {
    switch (tone) {
      case 'neutral':
        return {
          bg: colors.surfaceMuted,
          border: colors.border,
          text: colors.mutedForeground,
          dot: colors.mutedForeground,
        };
      case 'warning':
        return {
          bg: colors.warningSoft,
          border: 'transparent',
          text: colors.warning,
          dot: colors.warning,
        };
      case 'danger':
        return {
          bg: colors.dangerSoft,
          border: 'transparent',
          text: colors.danger,
          dot: colors.danger,
        };
      case 'primary':
      default:
        return {
          bg: colors.primarySoft,
          border: colors.primarySoftBorder,
          text: colors.primaryText,
          dot: colors.primaryText,
        };
    }
  };

  const badgeColors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColors.bg,
          borderColor: badgeColors.border,
          borderRadius: radius.full,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
    >
      {dot ? (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: badgeColors.dot,
              borderRadius: radius.full,
            },
          ]}
        />
      ) : null}
      <AppText
        variant="caption"
        style={[styles.text, { color: badgeColors.text }]}
      >
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
});
