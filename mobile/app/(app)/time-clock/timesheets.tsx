import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Clock, CalendarDays } from 'lucide-react-native';
import { Screen, AppText, EmptyState } from '@/components/ui';
import { DayCard } from '@/components/timeclock/DayCard';
import { WeekChart } from '@/components/timeclock/WeekChart';
import { DatePickerSheet } from '@/components/timeclock/DatePickerSheet';
import { useMinuteNow, useTimeEntries } from '@/hooks/useTimeClock';
import { dayRange, overlapsRange, weekRange, workedBetween } from '@/features/time-clock';
import { formatWeekRange, startOfWeekMonday } from '@/lib/dates';
import { useTheme } from '@/theme';

// The phone's date picker has no web version, so the week label is only tappable on phones.
const CAN_PICK_DATE = Platform.OS !== 'web';

export default function TimesheetsScreen() {
  const router = useRouter();
  const { colors, radius, iconSizes } = useTheme();
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [pickerOpen, setPickerOpen] = useState(false);

  const { to: weekEnd } = weekRange(weekStart);
  const { data: entries = [] } = useTimeEntries(weekStart, weekEnd);
  const now = useMinuteNow(entries.some((e) => !e.clockedOutAt));
  const isCurrentWeek = now >= weekStart.getTime() && now < weekEnd.getTime();
  const weekTotal = workedBetween(entries, weekStart, weekEnd, now);

  const week = Array.from({ length: 7 }, (_, i) => {
    const start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    const end = dayRange(start).to;
    const dayEntries = entries.filter((e) => overlapsRange(e, start, end, now));
    return { start, entries: dayEntries, worked: workedBetween(dayEntries, start, end, now) };
  });
  // Newest day first, only days with time on them.
  const workedDays = week.filter((d) => d.worked > 0).reverse();
  const todayIndex = isCurrentWeek ? (new Date(now).getDay() + 6) % 7 : null;

  const shiftWeek = (weeks: number) =>
    setWeekStart(
      new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + weeks * 7)
    );

  return (
    <Screen scroll padded bottomInset={false}>
      <View style={styles.content}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Back to Time clock"
        >
          <ChevronLeft size={iconSizes.sm} color={colors.heading} strokeWidth={2.2} />
          <AppText variant="small" tone="heading">
            Time clock
          </AppText>
        </Pressable>

        <AppText variant="display" tone="heading" accessibilityRole="header" style={styles.title}>
          My timesheets
        </AppText>

        <View
          style={[
            styles.weekBar,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg },
          ]}
        >
          <Pressable
            onPress={() => shiftWeek(-1)}
            style={styles.arrow}
            accessibilityRole="button"
            accessibilityLabel="Previous week"
          >
            <ChevronLeft size={iconSizes.md} color={colors.heading} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            onPress={CAN_PICK_DATE ? () => setPickerOpen(true) : undefined}
            disabled={!CAN_PICK_DATE}
            style={styles.weekLabel}
            accessibilityRole="button"
            accessibilityLabel={`Week of ${formatWeekRange(weekStart)}. Pick a day`}
          >
            {CAN_PICK_DATE ? (
              <CalendarDays size={iconSizes.sm} color={colors.primary} strokeWidth={2.2} />
            ) : null}
            <AppText variant="bodyStrong" tone="heading">
              {formatWeekRange(weekStart)}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => shiftWeek(1)}
            disabled={isCurrentWeek}
            style={[styles.arrow, isCurrentWeek ? styles.arrowDisabled : null]}
            accessibilityRole="button"
            accessibilityLabel="Next week"
            accessibilityState={{ disabled: isCurrentWeek }}
          >
            <ChevronRight size={iconSizes.md} color={colors.heading} strokeWidth={2.2} />
          </Pressable>
        </View>

        {!isCurrentWeek ? (
          <Pressable
            onPress={() => setWeekStart(startOfWeekMonday(new Date()))}
            style={styles.thisWeek}
            accessibilityRole="button"
          >
            <AppText variant="small" tone="link">
              Back to this week
            </AppText>
          </Pressable>
        ) : null}

        <View style={styles.chart}>
          <WeekChart days={week.map((d) => d.worked)} totalMs={weekTotal} todayIndex={todayIndex} />
        </View>

        {workedDays.length === 0 ? (
          <EmptyState
            card
            title="No time recorded this week"
            icon={<Clock size={44} color={colors.mutedForeground} strokeWidth={1.6} />}
          >
            {/* v2: Request a correction is hidden for now
            <Button label="Request a correction" variant="outline" size="md" onPress={() => {}} />
            */}
          </EmptyState>
        ) : (
          workedDays.map((day) => (
            <DayCard
              key={day.start.toISOString()}
              day={day.start}
              entries={day.entries}
              workedMs={day.worked}
              now={now}
            />
          ))
        )}
      </View>

      <DatePickerSheet
        visible={pickerOpen}
        initialDate={weekStart}
        maximumDate={new Date(now)}
        onSelect={(date) => {
          setWeekStart(startOfWeekMonday(date));
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 44,
    alignSelf: 'flex-start',
  },
  title: {
    marginTop: 4,
    marginBottom: 20,
  },
  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 4,
  },
  arrow: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  weekLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  thisWeek: {
    alignSelf: 'center',
    paddingVertical: 10,
  },
  chart: {
    marginTop: 16,
    marginBottom: 16,
  },
});
