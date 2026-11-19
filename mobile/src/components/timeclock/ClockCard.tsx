import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Button, Card } from '@/components/ui';
import { formatHoursMinutes } from '@/lib/dates';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface ClockCardProps {
  /** Time the operator clocked in, e.g. "6:02 AM"; null when clocked out. */
  clockedInSince: string | null;
  workedTodayMs: number;
  onClockIn: () => void;
  onClockOut: () => void;
}

export const ClockCard: React.FC<ClockCardProps> = ({
  clockedInSince,
  workedTodayMs,
  onClockIn,
  onClockOut,
}) => {
  const { colors, radius } = useTheme();
  const isIn = !!clockedInSince;

  return (
    <Card tone={isIn ? 'soft' : 'default'} style={{ ...styles.card, borderRadius: radius.xl }}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: isIn ? colors.doneSoft : colors.surfaceMuted,
            borderRadius: radius.full,
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: isIn ? colors.done : colors.mutedForeground, borderRadius: radius.full },
          ]}
        />
        <AppText style={[styles.pillText, { color: isIn ? colors.done : colors.mutedForeground }]}>
          {isIn ? `Clocked in · since ${clockedInSince}` : 'Clocked out'}
        </AppText>
      </View>

      <AppText
        style={[styles.total, { color: colors.heading }]}
        accessibilityLabel={`${formatHoursMinutes(workedTodayMs)} recorded today`}
      >
        {formatHoursMinutes(workedTodayMs)}
      </AppText>
      <AppText style={[styles.caption, { color: colors.mutedForeground }]}>Recorded today</AppText>

      <View style={styles.button}>
        {isIn ? (
          <Button label="Clock out" variant="outline" size="lg" onPress={onClockOut} />
        ) : (
          <Button label="Clock in" variant="primary" size="lg" onPress={onClockIn} />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 8,
    height: 8,
  },
  pillText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13.5,
  },
  total: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 44,
    lineHeight: 52,
    letterSpacing: -1,
    marginTop: 14,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    marginTop: 2,
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 20,
  },
});
