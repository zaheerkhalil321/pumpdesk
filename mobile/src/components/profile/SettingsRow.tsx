import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export type SettingsTint = 'teal' | 'blue' | 'navy' | 'green' | 'red';

export interface SettingsRowProps {
  icon: LucideIcon;
  tint: SettingsTint;
  label: string;
  /** Muted text on the right, e.g. the current choice. */
  value?: string;
  onPress?: () => void;
  /** Custom control on the right (e.g. a Switch); replaces value and chevron. */
  right?: React.ReactNode;
  destructive?: boolean;
  showDivider?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  tint,
  label,
  value,
  onPress,
  right,
  destructive = false,
  showDivider = true,
}) => {
  const { colors, radius, iconSizes } = useTheme();

  const tints: Record<SettingsTint, { fg: string; bg: string }> = {
    teal: { fg: colors.primary, bg: colors.primarySoft },
    blue: { fg: colors.info, bg: colors.infoSoft },
    navy: { fg: colors.heading, bg: colors.surfaceMuted },
    green: { fg: colors.done, bg: colors.doneSoft },
    red: { fg: colors.danger, bg: colors.dangerSoft },
  };
  const { fg, bg } = tints[tint];

  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      onPress={onPress ? handlePress : undefined}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={value ? `${label}, ${value}` : label}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceMuted : colors.surface },
      ]}
    >
      <View style={[styles.tile, { backgroundColor: bg, borderRadius: radius.sm + 2 }]}>
        <Icon size={18} color={fg} strokeWidth={2.2} />
      </View>
      <View
        style={[
          styles.body,
          showDivider ? { borderBottomColor: colors.border, borderBottomWidth: 1 } : null,
        ]}
      >
        <AppText
          style={[styles.label, { color: destructive ? colors.danger : colors.heading }]}
          numberOfLines={1}
        >
          {label}
        </AppText>
        {right ? (
          // Fixed slot on the right so a Switch lines up with chevrons and values above it.
          <View style={styles.rightSlot}>{right}</View>
        ) : (
          <View style={styles.right}>
            {value ? (
              <AppText style={[styles.value, { color: colors.mutedForeground }]} numberOfLines={1}>
                {value}
              </AppText>
            ) : null}
            {onPress && !destructive ? (
              <ChevronRight size={iconSizes.sm} color={colors.mutedForeground} strokeWidth={2} />
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  tile: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  body: {
    flex: 1,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 16,
    gap: 12,
  },
  label: {
    flexShrink: 1,
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  rightSlot: {
    marginLeft: 'auto',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  value: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
  },
});
