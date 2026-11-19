import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export interface ListRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  showDivider?: boolean;
  destructive?: boolean;
  leftIcon?: React.ReactNode;
  style?: ViewStyle;
}

export const ListRow: React.FC<ListRowProps> = ({
  label,
  value,
  onPress,
  showChevron = true,
  showDivider = true,
  destructive = false,
  leftIcon,
  style,
}) => {
  const { colors, heights, iconSizes, spacing } = useTheme();

  const handlePress = () => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: heights.listRow,
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.base,
        },
        style,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
    >
      <View style={styles.left}>
        {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
        <AppText
          variant="bodyStrong"
          tone={destructive ? 'danger' : 'default'}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>

      <View style={styles.right}>
        {value ? (
          <AppText variant="body" tone="muted" style={styles.valueText} numberOfLines={1}>
            {value}
          </AppText>
        ) : null}
        {showChevron && onPress ? (
          <ChevronRight
            size={iconSizes.sm}
            color={colors.mutedForeground}
            strokeWidth={iconSizes.strokeWidth}
          />
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  icon: {
    marginRight: 12,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    marginRight: 6,
  },
});
