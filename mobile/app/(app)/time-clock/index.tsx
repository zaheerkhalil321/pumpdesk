import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, AppText, Card, ListRow, useTopAlert } from '@/components/ui';
import { ClockCard } from '@/components/timeclock/ClockCard';
import { useTimeClock, workedBetween } from '@/hooks/useTimeClock';
import {
  formatDateInZone,
  formatHoursMinutes,
  formatLocalTime,
  startOfWeekMonday,
  DEFAULT_TIMEZONE,
} from '@/lib/dates';

const DAY_MS = 24 * 60 * 60 * 1000;

export default function TimeClockScreen() {
  const router = useRouter();
  const { showAlert } = useTopAlert();
  const { entries, openEntry, clockIn, clockOut } = useTimeClock();
  const [now, setNow] = useState(() => Date.now());

  // Keep the totals moving while the operator is on the clock.
  useEffect(() => {
    if (!openEntry) return;
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, [openEntry]);

  const today = new Date(now);
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const weekStart = startOfWeekMonday(today);
  const workedToday = workedBetween(entries, dayStart, new Date(dayStart.getTime() + DAY_MS), now);
  const workedWeek = workedBetween(entries, weekStart, new Date(weekStart.getTime() + 7 * DAY_MS), now);

  const handleClockIn = () => {
    clockIn();
    showAlert('Clocked in', { message: 'Your time is being recorded.' });
  };

  const handleClockOut = () => {
    clockOut();
    showAlert('Clocked out', { message: `${formatHoursMinutes(workedToday)} recorded today.` });
  };

  return (
    <Screen scroll padded bottomInset={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="display" tone="heading" accessibilityRole="header">
            Time clock
          </AppText>
          <AppText variant="body" tone="muted" style={styles.date}>
            {formatDateInZone(new Date(now), DEFAULT_TIMEZONE)}
          </AppText>
        </View>

        <ClockCard
          clockedInSince={openEntry ? formatLocalTime(openEntry.clockedInAt) : null}
          workedTodayMs={workedToday}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
        />

        <Card tone="default" style={styles.rows}>
          <ListRow label="This week" value={formatHoursMinutes(workedWeek)} showChevron={false} />
          <ListRow
            label="My timesheets"
            onPress={() => router.push('/(app)/time-clock/timesheets')}
            showDivider={false}
          />
          {/* v2: Request a correction is hidden for now
          <ListRow label="Request a correction" onPress={() => {}} showDivider={false} />
          */}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  date: {
    marginTop: 4,
  },
  rows: {
    padding: 0,
    overflow: 'hidden',
    marginTop: 20,
  },
});
