import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen,
  NavyHeader,
  AppText,
  Badge,
  Card,
  ListRow,
  NumberField,
  Checkbox,
  TextArea,
  useTopAlert,
  Button,
} from '@/components/ui';
import { TimePickerSheet } from '@/components/job/TimePickerSheet';
import { useJob } from '@/hooks/useJobs';
import { useTicket, useTicketExtras, useSaveTicket, useSubmitTicket } from '@/hooks/useTicket';
import { workTicketSubmitSchema } from '@/features/ticket-schema';
import { formatTimeInZone } from '@/lib/dates';
import { useTheme } from '@/theme';
import { SectionTitle } from '@/components/ticket/SectionTitle';
import { Clock, Droplets, Cable, ListChecks, MessageSquare, PenLine } from 'lucide-react-native';
import { WorkTicketDraft, OperatorJob, TicketExtra } from '@/api/types';

interface WorkTicketFormProps {
  job: OperatorJob;
  serverTicket: WorkTicketDraft | null | undefined;
  extrasList: TicketExtra[];
}

function WorkTicketForm({ job, serverTicket, extrasList }: WorkTicketFormProps) {
  const router = useRouter();
  const { showAlert } = useTopAlert();
  const { colors } = useTheme();
  const saveMutation = useSaveTicket();
  // `mutate` keeps the same identity between renders; the mutation object does not.
  const saveDraft = saveMutation.mutate;
  const submitMutation = useSubmitTicket();

  // Initialized directly from props - no cascading setState in effect
  const [arrivedOnSite, setArrivedOnSite] = useState<string | null>(
    serverTicket?.arrivedOnSiteAt || job.steps.arrived_site || null
  );
  const [startedPour, setStartedPour] = useState<string | null>(
    serverTicket?.startedPourAt || null
  );
  const [finishedPour, setFinishedPour] = useState<string | null>(
    serverTicket?.finishedPourAt || null
  );
  const [departedSite, setDepartedSite] = useState<string | null>(
    serverTicket?.departedSiteAt || job.steps.departed_site || null
  );
  const [yardsPumped, setYardsPumped] = useState(
    serverTicket?.yardsPumped != null ? String(serverTicket.yardsPumped) : ''
  );
  const [hose3in, setHose3in] = useState(
    serverTicket?.hose3inFt != null ? String(serverTicket.hose3inFt) : ''
  );
  const [hose4in, setHose4in] = useState(
    serverTicket?.hose4inFt != null ? String(serverTicket.hose4inFt) : ''
  );
  const [extras, setExtras] = useState<string[]>(serverTicket?.extras || []);
  const [comments, setComments] = useState(serverTicket?.comments || '');
  const [signerName] = useState<string | null>(serverTicket?.signerName || null);
  const [signaturePng] = useState<string | null>(serverTicket?.signaturePng || null);
  const [signedAt] = useState<string | null>(serverTicket?.signedAt || null);

  // Time picker modal state
  const [activeTimeField, setActiveTimeField] = useState<
    'arrivedOnSite' | 'startedPour' | 'finishedPour' | 'departedSite' | null
  >(null);
  const [timePickerError, setTimePickerError] = useState<string | undefined>();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isReadOnly = job.ticketStatus === 'submitted';

  // Debounced auto-save (800ms)
  const triggerAutoSave = useCallback(() => {
    if (isReadOnly || !job.id) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const draft: WorkTicketDraft = {
        jobId: job.id,
        arrivedOnSiteAt: arrivedOnSite,
        startedPourAt: startedPour,
        finishedPourAt: finishedPour,
        departedSiteAt: departedSite,
        yardsPumped: yardsPumped ? parseFloat(yardsPumped) : null,
        hose3inFt: hose3in ? parseInt(hose3in, 10) : null,
        hose4inFt: hose4in ? parseInt(hose4in, 10) : null,
        extras,
        comments,
        signerName,
        signaturePng,
        signedAt,
        updatedAt: new Date().toISOString(),
      };
      saveDraft(draft);
    }, 800);
  }, [
    isReadOnly,
    job.id,
    arrivedOnSite,
    startedPour,
    finishedPour,
    departedSite,
    yardsPumped,
    hose3in,
    hose4in,
    extras,
    comments,
    signerName,
    signaturePng,
    signedAt,
    saveDraft,
  ]);

  // Skip the first run so opening the form does not save an empty draft.
  const isFirstRunRef = useRef(true);
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }
    triggerAutoSave();
  }, [
    arrivedOnSite,
    startedPour,
    finishedPour,
    departedSite,
    yardsPumped,
    hose3in,
    hose4in,
    extras,
    comments,
    triggerAutoSave,
  ]);

  const handleSaveForLater = () => {
    const draft: WorkTicketDraft = {
      jobId: job.id,
      arrivedOnSiteAt: arrivedOnSite,
      startedPourAt: startedPour,
      finishedPourAt: finishedPour,
      departedSiteAt: departedSite,
      yardsPumped: yardsPumped ? parseFloat(yardsPumped) : null,
      hose3inFt: hose3in ? parseInt(hose3in, 10) : null,
      hose4inFt: hose4in ? parseInt(hose4in, 10) : null,
      extras,
      comments,
      signerName,
      signaturePng,
      signedAt,
      updatedAt: new Date().toISOString(),
    };
    saveMutation.mutate(draft);
    showAlert('Draft saved', { message: 'Finish and submit the ticket any time.' });
    router.back();
  };

  const handleSubmit = async () => {
    setValidationErrors({});

    const draft = {
      jobId: job.id,
      arrivedOnSiteAt: arrivedOnSite,
      startedPourAt: startedPour,
      finishedPourAt: finishedPour,
      departedSiteAt: departedSite,
      yardsPumped: yardsPumped ? parseFloat(yardsPumped) : null,
      hose3inFt: hose3in ? parseInt(hose3in, 10) : null,
      hose4inFt: hose4in ? parseInt(hose4in, 10) : null,
      extras,
      comments,
      signerName,
      signaturePng,
      signedAt,
      updatedAt: new Date().toISOString(),
    };

    const result = workTicketSubmitSchema.safeParse(draft);
    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        errMap[fieldName] = issue.message;
      });
      setValidationErrors(errMap);
      return;
    }

    try {
      await saveMutation.mutateAsync(draft);
      await submitMutation.mutateAsync(job.id);
      showAlert('Work ticket submitted');
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch {
      // ignore
    }
  };

  const handleSaveTimeField = (iso: string) => {
    setTimePickerError(undefined);
    if (activeTimeField === 'startedPour') {
      if (finishedPour && new Date(iso) >= new Date(finishedPour)) {
        setTimePickerError('Started pour must be before Finished pour.');
        return;
      }
      setStartedPour(iso);
    } else if (activeTimeField === 'finishedPour') {
      if (startedPour && new Date(iso) <= new Date(startedPour)) {
        setTimePickerError('Finished pour must be after Started pour.');
        return;
      }
      setFinishedPour(iso);
    } else if (activeTimeField === 'arrivedOnSite') {
      setArrivedOnSite(iso);
    } else if (activeTimeField === 'departedSite') {
      setDepartedSite(iso);
    }
    setActiveTimeField(null);
  };

  const toggleExtra = (code: string) => {
    if (isReadOnly) return;
    setExtras((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const badgeText = isReadOnly
    ? 'Submitted'
    : job.steps.departed_site
    ? 'Needs submission'
    : 'Draft saved';
  const badgeTone = isReadOnly ? 'primary' : job.steps.departed_site ? 'warning' : 'neutral';

  return (
    <View style={styles.root}>
      <NavyHeader
        backLabel="Job"
        onBack={() => router.back()}
        heading="Work ticket"
        subheading={[job.jobName || job.customerName, job.site.street].filter(Boolean).join(' · ')}
        badge={<Badge label={badgeText} tone={badgeTone} dot={badgeText === 'Needs submission'} />}
      />

      <Screen
        scroll
        padded
        headerBackground="navy"
        keyboardAvoiding
        contentContainerStyle={styles.content}
      >
        {/* 1. Times Section */}
        <View style={styles.section}>
          <SectionTitle title="Times" icon={Clock} />
          <Card tone="default" style={{ padding: 0, overflow: 'hidden' }}>
            <ListRow
              label="Arrived on site"
              value={arrivedOnSite ? formatTimeInZone(arrivedOnSite, job.timezone) : 'Tap to set'}
              onPress={!isReadOnly ? () => setActiveTimeField('arrivedOnSite') : undefined}
            />
            <ListRow
              label="Started pour"
              value={startedPour ? formatTimeInZone(startedPour, job.timezone) : 'Tap to set'}
              onPress={!isReadOnly ? () => setActiveTimeField('startedPour') : undefined}
            />
            <ListRow
              label="Finished pour"
              value={finishedPour ? formatTimeInZone(finishedPour, job.timezone) : 'Tap to set'}
              onPress={!isReadOnly ? () => setActiveTimeField('finishedPour') : undefined}
            />
            <ListRow
              label="Departed site"
              value={departedSite ? formatTimeInZone(departedSite, job.timezone) : 'Tap to set'}
              showDivider={false}
              onPress={!isReadOnly ? () => setActiveTimeField('departedSite') : undefined}
            />
          </Card>
          {validationErrors.startedPourAt ? (
            <AppText variant="small" tone="danger" style={styles.fieldError}>
              {validationErrors.startedPourAt}
            </AppText>
          ) : null}
          {validationErrors.finishedPourAt ? (
            <AppText variant="small" tone="danger" style={styles.fieldError}>
              {validationErrors.finishedPourAt}
            </AppText>
          ) : null}
        </View>

        {/* 2. Yards Pumped Section */}
        <View style={styles.section}>
          <SectionTitle title="Yards pumped" icon={Droplets} />
          <NumberField
            value={yardsPumped}
            onChangeText={setYardsPumped}
            suffix="yd³"
            allowDecimals
            error={validationErrors.yardsPumped}
          />
        </View>

        {/* 3. Hose Section */}
        <View style={styles.section}>
          <SectionTitle title="Hose" icon={Cable} />
          <Card tone="default" style={styles.hoseCard}>
            <NumberField
              inline
              label="3-inch hose"
              value={hose3in}
              onChangeText={setHose3in}
              suffix="ft"
              error={validationErrors.hose3inFt}
            />
            <NumberField
              inline
              label="4-inch hose"
              value={hose4in}
              onChangeText={setHose4in}
              suffix="ft"
              error={validationErrors.hose4inFt}
            />
          </Card>
        </View>

        {/* 4. Extras Section */}
        <View style={styles.section}>
          <SectionTitle title="Extras" icon={ListChecks} />
          <Card tone="default" style={styles.extrasCard}>
            {extrasList.map((extra) => (
              <Checkbox
                key={extra.code}
                label={extra.label}
                checked={extras.includes(extra.code)}
                onToggle={() => toggleExtra(extra.code)}
                disabled={isReadOnly}
              />
            ))}
          </Card>
        </View>

        {/* 5. Comments Section */}
        <View style={styles.section}>
          <SectionTitle title="Comments" icon={MessageSquare} hint="Optional" />
          <TextArea
            value={comments}
            onChangeText={setComments}
            placeholder="Add comments"
            editable={!isReadOnly}
            accessibilityLabel="Comments"
          />
        </View>

        {/* 6. Customer Signature Section */}
        <View style={styles.section}>
          <SectionTitle title="Customer signature" icon={PenLine} hint="Optional" />
          <Card tone="default" style={{ padding: 0, overflow: 'hidden' }}>
            <ListRow
              label={
                signaturePng && signerName
                  ? `Signed by ${signerName}`
                  : 'Get customer signature'
              }
              value={signedAt ? formatTimeInZone(signedAt, job.timezone) : undefined}
              onPress={
                !isReadOnly
                  ? () => router.push(`/(app)/(jobs)/${job.id}/signature` as any)
                  : undefined
              }
              showDivider={false}
            />
            {signaturePng ? (
              <View style={[styles.signaturePreview, { borderTopColor: colors.border }]}>
                <Image
                  source={{ uri: signaturePng }}
                  style={styles.signatureImage}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </Card>
        </View>

        {/* Actions at bottom */}
        {!isReadOnly ? (
          <View style={styles.footerActions}>
            <Button
              label="Submit work ticket"
              variant="primary"
              size="lg"
              loading={submitMutation.isPending}
              onPress={handleSubmit}
              style={styles.submitButton}
            />
            <Button
              label="Save for later"
              variant="link"
              onPress={handleSaveForLater}
            />
          </View>
        ) : (
          <View style={styles.submittedBanner}>
            <AppText variant="bodyStrong" tone="primaryText" style={{ textAlign: 'center' }}>
              This work ticket has been submitted and is locked for editing.
            </AppText>
          </View>
        )}
      </Screen>

      {/* Time Picker Modal */}
      {activeTimeField ? (
        <TimePickerSheet
          visible={!!activeTimeField}
          title={
            activeTimeField === 'arrivedOnSite'
              ? 'Arrived on site'
              : activeTimeField === 'startedPour'
              ? 'Started pour'
              : activeTimeField === 'finishedPour'
              ? 'Finished pour'
              : 'Departed site'
          }
          initialTime={
            activeTimeField === 'arrivedOnSite'
              ? arrivedOnSite
              : activeTimeField === 'startedPour'
              ? startedPour
              : activeTimeField === 'finishedPour'
              ? finishedPour
              : departedSite
          }
          timeZone={job.timezone}
          error={timePickerError}
          onSave={handleSaveTimeField}
          onClose={() => {
            setActiveTimeField(null);
            setTimePickerError(undefined);
          }}
        />
      ) : null}
    </View>
  );
}

export default function WorkTicketScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { data: job, isLoading: loadingJob } = useJob(jobId);
  const { data: serverTicket, isLoading: loadingTicket } = useTicket(jobId);
  const { data: extrasList = [] } = useTicketExtras();

  if (loadingJob || loadingTicket || !job) {
    return (
      <View style={styles.root}>
        <NavyHeader backLabel="Job" title="Work ticket" onBack={() => router.back()} />
        <Screen padded>
          <AppText variant="body" tone="muted" style={{ marginTop: 24, textAlign: 'center' }}>
            Loading work ticket...
          </AppText>
        </Screen>
      </View>
    );
  }

  return (
    <WorkTicketForm
      key={job.id}
      job={job}
      serverTicket={serverTicket}
      extrasList={extrasList}
    />
  );
}

const styles = StyleSheet.create({
  hoseCard: {
    paddingVertical: 12,
    paddingBottom: 4,
  },
  content: {
    paddingTop: 20,
  },
  root: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  jobTitle: {
    flex: 1,
    marginRight: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  fieldError: {
    marginTop: 6,
    marginLeft: 4,
  },
  extrasCard: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  signaturePreview: {
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  signatureImage: {
    width: '100%',
    height: 80,
  },
  footerActions: {
    marginTop: 12,
    marginBottom: 40,
  },
  submitButton: {
    marginBottom: 8,
  },
  submittedBanner: {
    marginTop: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
  },
});
