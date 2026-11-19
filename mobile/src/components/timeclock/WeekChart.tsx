import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { formatHoursMinutes } from '@/lib/dates';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface WeekChartProps {
  /** Worked ms for Monday..Sunday. */
  days: number[];
  totalMs: number;
  /** 0 = Monday … 6 = Sunday, or null when this week is not the current one. */
  todayIndex: number | null;
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_HEIGHT = 72;
const MIN_SCALE_MS = 8 * 60 * 60 * 1000; // an 8-hour day fills the bar

export const WeekChart: React.FC<WeekChartProps> = ({ days, totalMs, todayIndex }) => {
  const { colors, radius } = useTheme();
  const scale = Math.max(MIN_SCALE_MS, ...days);

  return (
    <Card tone="default" style={{ ...styles.card, borderRadius: radius.xl }}>
      <AppText style={[styles.total, { color: colors.heading }]}>{formatHoursMinutes(totalMs)}</AppText>
      <AppText style={[styles.caption, { color: colors.mutedForeground }]}>Recorded this week</AppText>

      <View
        style={styles.bars}
        accessibilityLabel={days
          .map((ms, i) => `${DAY_LETTERS[i]} ${formatHoursMinutes(ms)}`)
          .join(', ')}
      >
        {days.map((ms, i) => {
          const isToday = i === todayIndex;
          const fill = ms > 0 ? Math.max(6, Math.round((ms / scale) * BAR_HEIGHT)) : 0;
          return (
            <View key={i} style={styles.col}>
              <View
                style={[styles.track, { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm }]}
              >
                {fill > 0 ? (
                  <View
                    style={[
                      styles.fill,
                      {
                        height: fill,
                        backgroundColor: isToday ? colors.primary : colors.primarySoftBorder,
                        borderRadius: radius.sm,
                      },
                    ]}
                  />
                ) : null}
              </View>
              <AppText
                style={[
                  styles.letter,
                  { color: isToday ? colors.primary : colors.mutedForeground },
                ]}
              >
                {DAY_LETTERS[i]}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
  },
  total: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    fontFamily: fontFamilies.medium,
    fontSize: 13.5,
    marginTop: 2,
  },
  bars: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  track: {
    width: '100%',
    height: BAR_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
  },
  letter: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
  },
});
