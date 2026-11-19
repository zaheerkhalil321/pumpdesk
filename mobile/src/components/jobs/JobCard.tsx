import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Check, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Card, AppText, Button, CardTone } from '@/components/ui';
import { JobCardDetails } from './JobCardDetails';
import { OperatorJob } from '@/api/types';
import { formatTimeInZone } from '@/lib/dates';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export type JobCardRole = 'next' | 'completed' | 'later';

export interface JobCardProps {
  job: OperatorJob;
  role: JobCardRole;
  onPress: () => void;
  onAcknowledge?: (jobId: string) => void;
  isAcknowledging?: boolean;
  index?: number;
}

const ROLE_LABEL: Record<JobCardRole, string> = {
  completed: 'Completed',
  next: 'Next up',
  later: 'Later',
};

export const JobCard: React.FC<JobCardProps> = ({
  job,
  role,
  onPress,
  onAcknowledge,
  isAcknowledging = false,
  index = 0,
}) => {
  const { colors, radius } = useTheme();
  const [pressed, setPressed] = useState(false);
  // Reanimated style: subtle press-in feedback on the card.
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed ? 0.98 : 1, { damping: 20, stiffness: 300 }) }],
  }));

  const isCompleted = role === 'completed';
  const isNext = role === 'next';
  const isAcknowledged = !!job.acknowledgedAt;
  const cardTone: CardTone = isNext ? 'soft' : isCompleted ? 'muted' : 'default';

  // "10:30 AM" -> "10:30" + "AM"
  const [clock, meridiem] = formatTimeInZone(job.pourStartsAt, job.timezone).split(' ');
  // Status colours: done = green, next = solid teal, later = blue.
  const pill = isCompleted
    ? { text: colors.done, background: colors.doneSoft }
    : isNext
      ? { text: colors.primaryForeground, background: colors.primary }
      : { text: colors.info, background: colors.infoSoft };

  const handleAcknowledge = () => {
    if (!onAcknowledge) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onAcknowledge(job.id);
  };

  const ackLine = (
    <View style={styles.ackRow}>
      <View style={[styles.ackCircle, { backgroundColor: colors.primary }]}>
        <Check size={11} color={colors.primaryForeground} strokeWidth={3} />
      </View>
      <AppText style={[styles.ackText, { color: colors.primary }]}>Acknowledged</AppText>
    </View>
  );

  return (
    // Two layers: the outer one runs the entry animation, the inner one the press scale,
    // so the two transforms never fight.
    <Animated.View entering={FadeInDown.delay(index * 70).duration(360)}>
    <Animated.View
      style={[styles.shadow, { shadowColor: colors.navy, borderRadius: radius.xl }, pressStyle]}
    >
      <Card tone={cardTone} style={{ ...styles.card, borderRadius: radius.xl }}>
        <Pressable
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          accessibilityRole="button"
          accessibilityLabel={`${ROLE_LABEL[role]} job at ${clock} ${meridiem}, ${job.site.street ?? job.site.label}`}
        >
          <View style={styles.headRow}>
            <View style={styles.timeBlock}>
              <AppText style={[styles.clock, { color: colors.heading }]}>{clock}</AppText>
              <AppText style={[styles.meridiem, { color: colors.mutedForeground }]}>
                {meridiem}
              </AppText>
            </View>
            <View
              style={[styles.pill, { backgroundColor: pill.background, borderRadius: radius.full }]}
            >
              {isCompleted ? (
                <Check size={12} color={pill.text} strokeWidth={3} />
              ) : (
                <View style={[styles.dot, { backgroundColor: pill.text }]} />
              )}
              <AppText style={[styles.pillText, { color: pill.text }]}>{ROLE_LABEL[role]}</AppText>
            </View>
          </View>

          <JobCardDetails job={job} />
        </Pressable>

        {isNext ? (
          <View style={styles.actions}>
            {isAcknowledged ? (
              <>
                {ackLine}
                <Button label="Open job" variant="primary" size="md" onPress={onPress} />
              </>
            ) : (
              <>
                <Button
                  label="Acknowledge job"
                  variant="primary"
                  size="md"
                  loading={isAcknowledging}
                  onPress={handleAcknowledge}
                />
                <AppText style={[styles.caption, { color: colors.mutedForeground }]}>
                  Dispatch will see you received it
                </AppText>
              </>
            )}
          </View>
        ) : role === 'later' ? (
          <View style={styles.actions}>
            {isAcknowledged ? (
              <Pressable onPress={onPress} style={styles.openRow} accessibilityRole="button">
                {ackLine}
                <ArrowRight size={18} color={colors.mutedForeground} strokeWidth={2} />
              </Pressable>
            ) : onAcknowledge ? (
              <Button
                label="Acknowledge"
                variant="outline"
                size="sm"
                loading={isAcknowledging}
                onPress={handleAcknowledge}
              />
            ) : null}
          </View>
        ) : null}
      </Card>
    </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  shadow: {
    marginBottom: 14,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  card: {
    padding: 18,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  clock: {
    fontFamily: fontFamilies.extrabold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  meridiem: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  pillText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    letterSpacing: 0.4,
  },
  actions: {
    marginTop: 16,
  },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  ackCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  ackText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13.5,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 8,
  },
});
