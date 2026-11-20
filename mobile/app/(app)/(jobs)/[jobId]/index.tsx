import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Truck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  NavyHeader,
  AppText,
  Badge,
  Button,
  NavigateButton,
  MetaPair,
  ListRow,
  useTopAlert,
  OptionSheet,
} from '@/components/ui';
import { TimePickerSheet } from '@/components/job/TimePickerSheet';
import { EditTimesSheet } from '@/components/job/EditTimesSheet';
import { JobProgressHero } from '@/components/job/JobProgressHero';
import { StepTimeline } from '@/components/job/StepTimeline';
import { WorkTicketCard } from '@/components/job/WorkTicketCard';
import { NextStopCard } from '@/components/job/NextStopCard';
import {
  useJob,
  useTodayJobs,
  useAcknowledgeJob,
  useRecordJobStep,
  useUndoJobStep,
  useEditStepTime,
} from '@/hooks/useJobs';
import {
  getJobProgressState,
  getJobBadgeInfo,
  STEP_SEQUENCE,
  STEP_LABELS,
  validateStepTimeEdit,
} from '@/features/steps';
import { useOpenMaps } from '@/hooks/useOpenMaps';
import { formatTimeInZone } from '@/lib/dates';
import { JobStep } from '@/api/types';
import type { BadgeTone } from '@/components/ui/Badge';
import { useTheme } from '@/theme';

export default function JobScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { colors, iconSizes } = useTheme();

  const { data: job, isLoading } = useJob(jobId);
  const { data: todayJobs = [] } = useTodayJobs();

  const acknowledgeMutation = useAcknowledgeJob();
  const recordStepMutation = useRecordJobStep();
  const undoStepMutation = useUndoJobStep();
  const editTimeMutation = useEditStepTime();
  const { showAlert } = useTopAlert();


  // Time editing modal state
  const { navigate, sheet: mapsSheet } = useOpenMaps();
  const [editingStep, setEditingStep] = useState<JobStep | null>(null);
  const [editError, setEditError] = useState<string | undefined>();
  const [editTimesOpen, setEditTimesOpen] = useState(false);

  if (isLoading || !job) {
    return (
      <View style={styles.loadingContainer}>
        <NavyHeader backLabel="Jobs" onBack={() => router.back()} />
        <Screen padded>
          <AppText variant="body" tone="muted" style={{ marginTop: 24, textAlign: 'center' }}>
            Loading job details...
          </AppText>
        </Screen>
      </View>
    );
  }

  const progressState = getJobProgressState(job);
  const badgeInfo = getJobBadgeInfo(job);
  const jobTitle = job.jobName || job.customerName;
  const siteAddress = job.site.label;
  const pumpLabel = job.pump ? `${job.pump.unit} · ${job.pump.label}` : 'Standard';

  // Find next job today (if any) after departing site
  const nextJobToday = [...todayJobs]
    .sort((a, b) => new Date(a.pourStartsAt).getTime() - new Date(b.pourStartsAt).getTime())
    .find((j) => j.id !== job.id && !j.steps.departed_site && !j.isCancelled);

  // Actions
  const handleAcknowledge = async () => {
    const nowIso = new Date().toISOString();
    await acknowledgeMutation.mutateAsync({ jobId: job.id, at: nowIso });
    showAlert('Dispatch can see you received it');
  };

  const handleRecordStep = async (step: JobStep) => {
    const nowIso = new Date().toISOString();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    await recordStepMutation.mutateAsync({ jobId: job.id, step, at: nowIso });
    const label = STEP_LABELS[step].completed;
    const timeStr = formatTimeInZone(nowIso, job.timezone);
    showAlert(label, {
      message: timeStr,
      action: { label: 'Undo', onPress: () => handleUndo(step) },
    });
  };

  const handleUndo = async (step: JobStep) => {
    await undoStepMutation.mutateAsync({ jobId: job.id, step });
  };

  const handleSaveEditedTime = async (newIso: string) => {
    if (!editingStep) return;
    const validation = validateStepTimeEdit(job, editingStep, newIso);
    if (!validation.valid) {
      setEditError(validation.error);
      return;
    }
    await editTimeMutation.mutateAsync({
      jobId: job.id,
      step: editingStep,
      at: newIso,
    });
    setEditingStep(null);
    setEditError(undefined);
  };

  // MetaPair display logic:
  // Before arriving at shop: Arrive by & Pump
  // From arrive shop to arrive site: Pour starts & Pump
  // On site: Only Pump
  const renderMetaPair = () => {
    if (progressState === 'not_acknowledged' || progressState === 'acknowledged') {
      const arriveByTime = job.arriveShopBy
        ? formatTimeInZone(job.arriveShopBy, job.timezone)
        : '8:00 AM';
      return (
        <MetaPair
          left={{ label: 'Arrive at shop by', value: arriveByTime }}
          right={{ label: 'Pump', value: pumpLabel }}
          style={styles.metaPair}
        />
      );
    }

    if (progressState === 'arrived_shop' || progressState === 'departed_shop') {
      const pourTime = formatTimeInZone(job.pourStartsAt, job.timezone);
      return (
        <MetaPair
          left={{ label: 'Pour starts', value: pourTime }}
          right={{ label: 'Pump', value: pumpLabel }}
          style={styles.metaPair}
        />
      );
    }

    // Left the site: the check line below replaces the details
    if (progressState === 'departed_site') return null;

    // On site: Only pump
    return (
      <MetaPair
        left={{ label: 'Pump', value: pumpLabel }}
        style={styles.metaPair}
      />
    );
  };

  // Steps already done, in order. Once on site, one "Edit times" link replaces the per-row "Edit".
  const doneSteps = STEP_SEQUENCE.filter((step) => !!job.steps[step]);
  const isOnSite = progressState === 'arrived_site';

  // Work ticket button copy & badge
  const isTicketSubmitted = job.ticketStatus === 'submitted';
  const isAfterSiteDeparture = !!job.steps.departed_site;
  const ticketBadgeLabel = isTicketSubmitted
    ? 'Submitted'
    : isAfterSiteDeparture
    ? 'Needs submission'
    : 'In progress';
  const ticketBadgeTone: BadgeTone = isTicketSubmitted
    ? 'primary'
    : isAfterSiteDeparture
    ? 'warning'
    : 'primary';

  const ticketButtonLabel = isTicketSubmitted
    ? 'View work ticket'
    : isAfterSiteDeparture
    ? 'Finish & submit ticket'
    : job.ticketStatus === 'draft'
    ? 'Continue work ticket'
    : 'Complete work ticket';

  return (
    <View style={styles.root}>
      <NavyHeader
        backLabel="Jobs"
        onBack={() => router.back()}
        heading={jobTitle}
        subheading={siteAddress}
        badge={
          <JobProgressHero
            job={job}
            badge={badgeInfo ? <Badge label={badgeInfo.label} tone={badgeInfo.tone} /> : null}
          />
        }
      />

      <Screen scroll padded headerBackground="navy" contentContainerStyle={styles.content}>
        {/* Cancelled Banner */}
        {job.isCancelled ? (
          <View style={[styles.banner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <AppText variant="bodyStrong" tone="danger">
              Dispatch cancelled this job
            </AppText>
          </View>
        ) : null}

        {/* Updated Banner */}
        {job.changedSinceSeen ? (
          <View style={[styles.banner, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
            <AppText variant="bodyStrong" tone="warning">
              Dispatch updated this job
            </AppText>
          </View>
        ) : null}

        {/* Top Header Information */}
        <View style={styles.topInfo}>
          {renderMetaPair()}
        </View>

        {/* Done Step Rows */}
        <View style={styles.stepsCardWrapper}>
          <StepTimeline
            job={job}
            onEditAll={isOnSite ? () => setEditTimesOpen(true) : undefined}
            onEditStep={
              !isOnSite && progressState !== 'departed_site'
                ? (step) => {
                    setEditingStep(step);
                    setEditError(undefined);
                  }
                : undefined
            }
          />
        </View>

        {/* Main Step Action Buttons */}
        {!job.isCancelled ? (
          <View style={styles.actionsSection}>
            {progressState === 'not_acknowledged' ? (
              <Button
                label="Acknowledge job"
                variant="primary"
                size="lg"
                loading={acknowledgeMutation.isPending}
                onPress={handleAcknowledge}
                caption="Dispatch will see you received it"
              />
            ) : progressState === 'acknowledged' ? (
              <View style={styles.buttonStack}>
                <Button
                  label="Arrived at shop"
                  variant="primary"
                  size="lg"
                  loading={recordStepMutation.isPending}
                  onPress={() => handleRecordStep('arrived_shop')}
                />
                <NavigateButton
                  label="Navigate to shop"
                  subLabel={job.shop.label}
                  onPress={() => navigate(job.shop)}
                />
              </View>
            ) : progressState === 'arrived_shop' ? (
              <View style={styles.buttonStack}>
                <Button
                  label="Depart shop"
                  variant="primary"
                  size="lg"
                  loading={recordStepMutation.isPending}
                  onPress={() => handleRecordStep('departed_shop')}
                />
                <NavigateButton
                  label="Navigate to job site"
                  onPress={() => navigate(job.site)}
                />
              </View>
            ) : progressState === 'departed_shop' ? (
              <View style={styles.buttonStack}>
                <Button
                  label="Arrived at job site"
                  variant="primary"
                  size="lg"
                  loading={recordStepMutation.isPending}
                  onPress={() => handleRecordStep('arrived_site')}
                />
                <NavigateButton
                  label="Navigate to job site"
                  onPress={() => navigate(job.site)}
                />
              </View>
            ) : progressState === 'arrived_site' ? (
              <View style={styles.buttonStack}>
                <WorkTicketCard
                  statusLabel={ticketBadgeLabel}
                  statusTone={ticketBadgeTone}
                  buttonLabel={ticketButtonLabel}
                  submitted={isTicketSubmitted}
                  onPress={() => router.push(`/(app)/(jobs)/${job.id}/ticket` as any)}
                />

                {/* Depart job site button */}
                <Button
                  label="Depart job site"
                  variant="outline"
                  outlineTone="link"
                  size="lg"
                  leftIcon={<Truck size={iconSizes.sm} color={colors.link} />}
                  loading={recordStepMutation.isPending}
                  onPress={() => handleRecordStep('departed_site')}
                />
              </View>
            ) : progressState === 'departed_site' ? (
              <View style={styles.buttonStack}>
                <WorkTicketCard
                  statusLabel={ticketBadgeLabel}
                  statusTone={ticketBadgeTone}
                  buttonLabel={ticketButtonLabel}
                  submitted={isTicketSubmitted}
                  onPress={() => router.push(`/(app)/(jobs)/${job.id}/ticket` as any)}
                />

                <NextStopCard
                  nextJob={nextJobToday ?? null}
                  shop={job.shop}
                  onGoToNextJob={() =>
                    nextJobToday && router.replace(`/(app)/(jobs)/${nextJobToday.id}` as any)
                  }
                  onNavigateToShop={() => navigate(job.shop)}
                />

                <TouchableOpacity
                  onPress={() => router.replace('/(app)/(jobs)')}
                  style={styles.backToTodayLink}
                  accessibilityRole="button"
                  accessibilityLabel="Back to Today"
                >
                  <AppText variant="body" tone="link">
                    Back to Today
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Bottom List Rows */}
        <View style={styles.listRowsContainer}>
          <View style={[styles.plainRows, { borderTopColor: colors.border }]}>
            {!isOnSite && progressState !== 'departed_site' ? (
              <ListRow
                label="Work ticket"
                value={isTicketSubmitted ? 'Submitted' : job.ticketStatus === 'draft' ? 'Draft saved' : undefined}
                onPress={() => router.push(`/(app)/(jobs)/${job.id}/ticket` as any)}
              />
            ) : null}
            <ListRow
              label="Customer & details"
              onPress={() => router.push(`/(app)/(jobs)/${job.id}/details` as any)}
            />
          </View>
        </View>
      </Screen>

      <OptionSheet {...mapsSheet} />

      {/* Edit times list (on site) */}
      <EditTimesSheet
        visible={editTimesOpen}
        items={doneSteps.map((step) => ({
          key: step,
          label: STEP_LABELS[step].completed,
          time: formatTimeInZone(job.steps[step] as string, job.timezone),
        }))}
        onSelect={(key) => {
          setEditTimesOpen(false);
          setEditingStep(key as JobStep);
          setEditError(undefined);
        }}
        onClose={() => setEditTimesOpen(false)}
      />

      {/* Time Picker Modal */}
      {editingStep ? (
        <TimePickerSheet
          visible={!!editingStep}
          title={STEP_LABELS[editingStep].completed}
          initialTime={job.steps[editingStep]}
          timeZone={job.timezone}
          error={editError}
          onSave={handleSaveEditedTime}
          onClose={() => {
            setEditingStep(null);
            setEditError(undefined);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 20,
  },
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 8,
  },
  topInfo: {
    marginTop: 16,
    marginBottom: 16,
  },
  titleRow: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
  },
  address: {
    lineHeight: 22,
    marginBottom: 16,
  },
  metaPair: {
    marginTop: 4,
  },
  stepsCardWrapper: {
    marginTop: 8,
    marginBottom: 24,
  },
  actionsSection: {
    marginBottom: 24,
  },
  buttonStack: {
    gap: 14,
  },
  ticketCard: {
    padding: 16,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketCardSub: {
    marginVertical: 8,
  },
  nextStopCard: {
    padding: 16,
  },
  nextStopOverline: {
    marginBottom: 4,
  },
  backToTodayLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  plainRows: {
    borderTopWidth: 1,
  },
  listRowsContainer: {
    marginBottom: 32,
  },
});
