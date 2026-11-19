import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface ProfileStat {
  value: string;
  label: string;
}

/** Three quick numbers about the operator's day and week. */
export const ProfileStats: React.FC<{ stats: ProfileStat[] }> = ({ stats }) => {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl },
      ]}
    >
      {stats.map((stat, i) => (
        <View
          key={stat.label}
          style={[
            styles.cell,
            i > 0 ? { borderLeftColor: colors.border, borderLeftWidth: 1 } : null,
          ]}
          accessible
          accessibilityLabel={`${stat.value} ${stat.label}`}
        >
          <AppText style={[styles.value, { color: colors.heading }]}>{stat.value}</AppText>
          <AppText style={[styles.label, { color: colors.mutedForeground }]} numberOfLines={1}>
            {stat.label}
          </AppText>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 24,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  value: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 20,
    lineHeight: 26,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 12.5,
    marginTop: 2,
  },
});
