import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface SectionTitleProps {
  title: string;
  icon: LucideIcon;
  /** Small muted text on the right, e.g. "Optional". */
  hint?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, icon: Icon, hint }) => {
  const { colors, radius } = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.tile, { backgroundColor: colors.primarySoft, borderRadius: radius.sm }]}>
        <Icon size={16} color={colors.primary} strokeWidth={2.2} />
      </View>
      <AppText style={[styles.title, { color: colors.heading }]} accessibilityRole="header">
        {title}
      </AppText>
      {hint ? (
        <AppText style={[styles.hint, { color: colors.mutedForeground }]}>{hint}</AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  tile: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fontFamilies.bold,
    fontSize: 17,
  },
  hint: {
    fontFamily: fontFamilies.medium,
    fontSize: 13,
  },
});
