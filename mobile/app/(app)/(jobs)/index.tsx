import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  ScrollView,
  // TouchableOpacity, // v2: notification bell is hidden for now
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'lucide-react-native'; // v2: Bell (notifications) hidden for now
// import * as Haptics from 'expo-haptics';
import {
  Screen,
  AppText,
  SegmentedControl,
  EmptyState,
  Button,
  ContactDispatchButtons,
  useTopAlert,
} from '@/components/ui';
import { OfflineBar } from '@/components/ui/OfflineBar';
import { JobCard } from '@/components/jobs/JobCard';
import { useAuth } from '@/hooks/useAuth';
import { useTodayJobs, useUpcomingJobs, useAcknowledgeJob } from '@/hooks/useJobs';
import { useOnline } from '@/hooks/useOnline';
import { formatDateInZone, DEFAULT_TIMEZONE } from '@/lib/dates';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';
import { OperatorJob } from '@/api/types';

export default function JobsScreen() {
  const router = useRouter();
  const { colors, spacing } = useTheme();
  const { operator } = useAuth();
  const isOnline = useOnline();
  const { showAlert } = useTopAlert();

  const [tabIndex, setTabIndex] = useState(0); // 0 = Today, 1 = Upcoming

  const {
    data: todayJobs = [],
    isLoading: loadingToday,
    refetch: refetchToday,
    isRefetching: refetchingToday,
  } = useTodayJobs();

  const {
    data: upcomingJobs = [],
    isLoading: loadingUpcoming,
    refetch: refetchUpcoming,
    isRefetching: refetchingUpcoming,
  } = useUpcomingJobs();

  const acknowledgeMutation = useAcknowledgeJob();

  const firstName = operator?.firstName || 'Rob';
  const dispatchPhone = operator?.company?.dispatchPhone || '+12075550199';
  const todayDateString = formatDateInZone(new Date(), DEFAULT_TIMEZONE);

  // v2: notification bell is hidden for now
  // const handleNotifications = () => {
  //   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  //   showAlert('No new notifications');
  // };

  const handleAcknowledge = async (jobId: string) => {
    try {
      await acknowledgeMutation.mutateAsync({
        jobId,
        at: new Date().toISOString(),
      });
      showAlert('Dispatch can see you received it');
    } catch {
      // handled optimistically
    }
  };

  const handleRefresh = async () => {
    if (tabIndex === 0) {
      await refetchToday();
    } else {
      await refetchUpcoming();
    }
  };

  // Categorize today's jobs into completed, next, later cleanly without mutation
  const sortedToday = [...todayJobs].sort(
    (a, b) => new Date(a.pourStartsAt).getTime() - new Date(b.pourStartsAt).getTime()
  );
  const nextJobIndex = sortedToday.findIndex((j) => !j.steps.departed_site);
  const categorizedTodayJobs = sortedToday.map((job, idx) => {
    if (job.steps.departed_site) {
      return { job, role: 'completed' as const };
    }
    if (idx === nextJobIndex) {
      return { job, role: 'next' as const };
    }
    return { job, role: 'later' as const };
  });

  const completedCount = categorizedTodayJobs.filter((c) => c.role === 'completed').length;

  // Group upcoming jobs by date heading
  const upcomingByDate: Record<string, OperatorJob[]> = {};
  [...upcomingJobs]
    .sort((a, b) => new Date(a.pourStartsAt).getTime() - new Date(b.pourStartsAt).getTime())
    .forEach((job) => {
      const dateHeader = formatDateInZone(job.pourStartsAt, job.timezone);
      if (!upcomingByDate[dateHeader]) {
        upcomingByDate[dateHeader] = [];
      }
      upcomingByDate[dateHeader].push(job);
    });

  return (
    <Screen padded={false} bottomInset={false}>
      <OfflineBar isOnline={isOnline} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.screenPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refetchingToday || refetchingUpcoming}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.headerSection}>
          <View style={styles.topTitleRow}>
            <AppText style={[styles.title, { color: colors.heading }]}>
              Hi, {firstName}
            </AppText>
            {/* v2: notification bell is hidden for now
            <TouchableOpacity
              onPress={handleNotifications}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              style={styles.bellButton}
            >
              <Bell size={24} color={colors.heading} strokeWidth={2} />
            </TouchableOpacity>
            */}
          </View>

          <SegmentedControl
            options={['Today', 'Upcoming']}
            selectedIndex={tabIndex}
            onChange={(idx) => setTabIndex(idx)}
            style={styles.segmented}
          />

          {tabIndex === 0 ? (
            <View style={styles.dateRow}>
              <Calendar
                size={18}
                color={colors.heading}
                strokeWidth={1.8}
                style={styles.calendarIcon}
              />
              <AppText style={[styles.dateText, { color: colors.heading }]}>
                {todayDateString}
              </AppText>
              {categorizedTodayJobs.length > 0 ? (
                <AppText style={[styles.summaryText, { color: colors.mutedForeground }]}>
                  {completedCount} of {categorizedTodayJobs.length} done
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Tab 0: Today */}
        {tabIndex === 0 ? (
          categorizedTodayJobs.length === 0 && !loadingToday ? (
            <EmptyState
              title="No jobs assigned today"
              image={require('@/../assets/images/pump-truck-empty.png')}
            >
              <Button
                label="View upcoming jobs"
                variant="primary"
                size="md"
                onPress={() => setTabIndex(1)}
                style={{ marginBottom: 12, width: '100%' }}
              />
              <ContactDispatchButtons dispatchPhone={dispatchPhone} />
            </EmptyState>
          ) : (
            <View style={styles.jobList}>
              {categorizedTodayJobs.map(({ job, role }, idx) => (
                <JobCard
                  key={job.id}
                  job={job}
                  role={role}
                  index={idx}
                  onPress={() => router.push(`/(app)/(jobs)/${job.id}` as any)}
                  onAcknowledge={handleAcknowledge}
                  isAcknowledging={acknowledgeMutation.isPending}
                />
              ))}
            </View>
          )
        ) : null}

        {/* Tab 1: Upcoming */}
        {tabIndex === 1 ? (
          Object.keys(upcomingByDate).length === 0 && !loadingUpcoming ? (
            <EmptyState
              title="No upcoming jobs yet"
              subtitle="Dispatch will assign and notify you as new pours are scheduled."
            >
              <ContactDispatchButtons dispatchPhone={dispatchPhone} />
            </EmptyState>
          ) : (
            <View style={styles.upcomingContainer}>
              {Object.entries(upcomingByDate).map(([dateHeading, jobs]) => (
                <View key={dateHeading} style={styles.dateGroup}>
                  <AppText variant="headline" tone="heading" style={styles.dateGroupHeading}>
                    {dateHeading}
                  </AppText>
                  {jobs.map((job, idx) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      role="later"
                      index={idx}
                      onPress={() => router.push(`/(app)/(jobs)/${job.id}` as any)}
                      onAcknowledge={handleAcknowledge}
                      isAcknowledging={acknowledgeMutation.isPending}
                    />
                  ))}
                </View>
              ))}
            </View>
          )
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
  },
  topTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 28,
    lineHeight: 34,
  },
  bellButton: {
    padding: 6,
    marginRight: -6,
  },
  segmented: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarIcon: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontFamily: fontFamilies.medium,
    fontSize: 15,
  },
  summaryText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13.5,
  },
  jobList: {
    width: '100%',
  },
  upcomingContainer: {
    width: '100%',
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateGroupHeading: {
    marginBottom: 12,
  },
});