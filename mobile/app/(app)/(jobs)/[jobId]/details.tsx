import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Phone, MessageCircle } from 'lucide-react-native';
import {
  Screen,
  NavyHeader,
  AppText,
  Badge,
  NavigateButton,
  ContactDispatchButtons,
  OptionSheet,
} from '@/components/ui';
import { useJob } from '@/hooks/useJobs';
import { useOpenMaps } from '@/hooks/useOpenMaps';
import { openCallDispatch, openTextDispatch } from '@/features/contact-dispatch';
import { formatTimeInZone } from '@/lib/dates';
import { useTheme } from '@/theme';

export default function CustomerDetailsScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const { colors, iconSizes } = useTheme();

  const { data: job, isLoading } = useJob(jobId);
  const { navigate, sheet: mapsSheet } = useOpenMaps();

  if (isLoading || !job) {
    return (
      <View style={styles.root}>
        <NavyHeader backLabel="Job" onBack={() => router.back()} />
        <Screen padded>
          <AppText variant="body" tone="muted" style={{ marginTop: 24, textAlign: 'center' }}>
            Loading details...
          </AppText>
        </Screen>
      </View>
    );
  }

  const jobName = job.jobName || job.customerName;
  const siteAddress = job.site.label;
  const pumpLabel = job.pump ? `${job.pump.unit} · ${job.pump.label}` : 'Standard';
  const arriveShopTime = job.arriveShopBy
    ? formatTimeInZone(job.arriveShopBy, job.timezone)
    : '8:00 AM';
  const pourStartTime = formatTimeInZone(job.pourStartsAt, job.timezone);

  return (
    <View style={styles.root}>
      <NavyHeader
        backLabel="Job"
        onBack={() => router.back()}
        heading="Customer & details"
        badge={<Badge label={jobName} tone="primary" />}
      />

      <Screen scroll padded headerBackground="navy" contentContainerStyle={styles.content}>
        {/* 1. CUSTOMER */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted" style={styles.overline}>
            Customer
          </AppText>
          <AppText variant="title" tone="heading">
            {job.customerName}
          </AppText>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* 2. SITE */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted" style={styles.overline}>
            Site
          </AppText>
          <AppText variant="headline" tone="default" style={styles.siteAddress}>
            {siteAddress}
          </AppText>
          <NavigateButton
            label="Navigate to site"
            onPress={() => navigate(job.site)}
            style={{ marginTop: 12 }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* 3. SITE CONTACT */}
        {job.siteContact ? (
          <>
            <View style={styles.section}>
              <AppText variant="overline" tone="muted" style={styles.overline}>
                Site contact
              </AppText>
              <View style={styles.contactRow}>
                <View style={styles.contactInfo}>
                  <AppText variant="headline" tone="heading">
                    {job.siteContact.name}
                  </AppText>
                  {job.siteContact.role ? (
                    <AppText variant="small" tone="muted">
                      {job.siteContact.role}
                    </AppText>
                  ) : null}
                </View>

                {job.siteContact.phone ? (
                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      onPress={() => openTextDispatch(job.siteContact!.phone!)}
                      style={[styles.smallActionBtn, { borderColor: colors.border }]}
                      accessibilityRole="button"
                      accessibilityLabel="Text site contact"
                    >
                      <MessageCircle size={iconSizes.sm} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openCallDispatch(job.siteContact!.phone!)}
                      style={[styles.smallActionBtn, { borderColor: colors.border }]}
                      accessibilityRole="button"
                      accessibilityLabel="Call site contact"
                    >
                      <Phone size={iconSizes.sm} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </>
        ) : null}

        {/* 4. SCHEDULE */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted" style={styles.overline}>
            Schedule
          </AppText>
          <View style={styles.scheduleRow}>
            <AppText variant="body" tone="default">
              Arrive at shop by
            </AppText>
            <AppText variant="bodyStrong" tone="heading">
              {arriveShopTime}
            </AppText>
          </View>
          <View style={[styles.scheduleRow, { marginTop: 6 }]}>
            <AppText variant="body" tone="default">
              Pour starts
            </AppText>
            <AppText variant="bodyStrong" tone="heading">
              {pourStartTime}
            </AppText>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* 5. PUMP */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted" style={styles.overline}>
            Pump
          </AppText>
          <AppText variant="title" tone="heading">
            {pumpLabel}
          </AppText>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* 6. JOB NOTES */}
        <View style={styles.section}>
          <AppText variant="overline" tone="muted" style={styles.overline}>
            Job notes
          </AppText>
          <AppText
            variant="body"
            tone={job.notesForOperator ? 'default' : 'muted'}
            style={styles.notesText}
          >
            {job.notesForOperator || 'No notes from dispatch'}
          </AppText>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Contact Dispatch Buttons at bottom */}
        <View style={styles.bottomDispatchSection}>
          <ContactDispatchButtons />
        </View>
      </Screen>
      <OptionSheet {...mapsSheet} />
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
  pageTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  topBadgeRow: {
    marginBottom: 8,
  },
  section: {
    paddingVertical: 14,
  },
  overline: {
    marginBottom: 6,
  },
  siteAddress: {
    lineHeight: 24,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notesText: {
    lineHeight: 22,
  },
  bottomDispatchSection: {
    marginTop: 20,
    marginBottom: 40,
  },
});
