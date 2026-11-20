import React, { useCallback, useState } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Screen, AppText, Card, ListRow, useTopAlert } from '@/components/ui';
import { ClockCard } from '@/components/timeclock/ClockCard';
import { useTimeClock } from '@/hooks/useTimeClock';
import { useTheme } from '@/theme';
import {
  formatDateInZone,
  formatHoursMinutes,
  formatLocalTime,
  DEFAULT_TIMEZONE,
} from '@/lib/dates';

export default function TimeClockScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showAlert } = useTopAlert();
  const { openEntry, now, workedToday, workedWeek, clockIn, clockOut, refetch, loadFailed } =
    useTimeClock();
  const [pulling, setPulling] = useState(false);

  // Hours can change in the office, so reload whenever the tab comes into view.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleRefresh = async () => {
    setPulling(true);
    try {
      await refetch();
    } finally {
      setPulling(false);
    }
  };

  const handleClockIn = () => {
    clockIn();
    showAlert('Clocked in', { message: 'Your time is being recorded.' });
  };

  const handleClockOut = () => {
    clockOut();
    showAlert('Clocked out', { message: `${formatHoursMinutes(workedToday)} recorded today.` });
  };

  return (
    <Screen
      scroll
      padded
      bottomInset={false}
      refreshControl={
        <RefreshControl refreshing={pulling} onRefresh={handleRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="display" tone="heading" accessibilityRole="header">
            Time clock
          </AppText>
          <AppText variant="body" tone="muted" style={styles.date}>
            {formatDateInZone(new Date(now), DEFAULT_TIMEZONE)}
          </AppText>
          {loadFailed ? (
            <AppText variant="small" tone="danger" style={styles.date}>
              Couldn&apos;t load your hours. Pull down to try again.
            </AppText>
          ) : null}
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
