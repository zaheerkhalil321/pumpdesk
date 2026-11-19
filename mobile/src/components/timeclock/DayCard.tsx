import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { AppText, Card } from '@/components/ui';
import type { ClockEntry } from '@/hooks/useTimeClock';
import { formatHoursMinutes, formatLocalDayLabel, formatLocalTime } from '@/lib/dates';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface DayCardProps {
  day: Date;
  entries: ClockEntry[];
  workedMs: number;
  now: number;
}

export const DayCard: React.FC<DayCardProps> = ({ day, entries, workedMs, now }) => {
  const { colors, radius } = useTheme();

  return (
    <Card tone="default" style={{ ...styles.card, borderRadius: radius.xl }}>
      <View style={styles.head}>
        <AppText style={[styles.day, { color: colors.heading }]}>{formatLocalDayLabel(day)}</AppText>
        <View style={[styles.totalPill, { backgroundColor: colors.primarySoft, borderRadius: radius.full }]}>
          <AppText style={[styles.totalText, { color: colors.primary }]}>
            {formatHoursMinutes(workedMs)}
          </AppText>
        </View>
      </View>

      {entries.map((entry, index) => {
        const start = new Date(entry.clockedInAt).getTime();
        const end = entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : now;
        const running = !entry.clockedOutAt;
        return (
          <View
            key={entry.clockedInAt}
            style={[
              styles.shift,
              index > 0 ? { borderTopColor: colors.border, borderTopWidth: 1 } : null,
            ]}
          >
            <View style={styles.times}>
              <AppText style={[styles.time, { color: colors.heading }]}>
                {formatLocalTime(entry.clockedInAt)}
              </AppText>
              <ArrowRight size={14} color={colors.mutedForeground} strokeWidth={2} />
              {running ? (
                <View style={[styles.live, { backgroundColor: colors.doneSoft, borderRadius: radius.full }]}>
                  <View style={[styles.liveDot, { backgroundColor: colors.done, borderRadius: radius.full }]} />
                  <AppText style={[styles.liveText, { color: colors.done }]}>On the clock</AppText>
                </View>
              ) : (
                <AppText style={[styles.time, { color: colors.heading }]}>
                  {formatLocalTime(entry.clockedOutAt as string)}
                </AppText>
              )}
            </View>
            <AppText style={[styles.duration, { color: colors.mutedForeground }]}>
              {formatHoursMinutes(end - start)}
            </AppText>
          </View>
        );
      })}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  day: {
    fontFamily: fontFamilies.bold,
    fontSize: 17,
  },
  totalPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  totalText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13.5,
    fontVariant: ['tabular-nums'],
  },
  shift: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  times: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  time: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  duration: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
  },
  liveText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 12.5,
  },
});
