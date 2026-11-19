import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { OperatorJob, JobStep } from '@/api/types';
import { STEP_SEQUENCE, STEP_LABELS } from '@/features/steps';
import { formatTimeInZone } from '@/lib/dates';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface StepTimelineProps {
  job: OperatorJob;
  /** Edit one step's time (before the operator is on site). */
  onEditStep?: (step: JobStep) => void;
  /** One "Edit times" link for every step (on site). */
  onEditAll?: () => void;
}

const DOT = 24;

// Wording for a step that has not happened yet.
const TODO_LABEL: Record<JobStep, string> = {
  arrived_shop: 'Arrive at shop',
  departed_shop: 'Leave the shop',
  arrived_site: 'Arrive at job site',
  departed_site: 'Leave the job site',
};

function currentHint(job: OperatorJob, step: JobStep): string {
  switch (step) {
    case 'arrived_shop':
      return job.shop.label;
    case 'departed_shop':
      return 'Load up and head out';
    case 'arrived_site':
      return job.site.label;
    case 'departed_site':
      return 'Pumping on site';
  }
}

const PulseDot: React.FC = () => {
  const { colors, radius } = useTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1);
  }, [pulse]);

  // Reanimated style: the ring grows and fades out on a loop.
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.9 }],
  }));

  return (
    <View style={styles.dotBox}>
      <Animated.View
        style={[styles.ring, { backgroundColor: colors.primary, borderRadius: radius.full }, ringStyle]}
      />
      <View
        style={[
          styles.dot,
          { backgroundColor: colors.surface, borderColor: colors.primary, borderRadius: radius.full },
        ]}
      >
        <View style={[styles.core, { backgroundColor: colors.primary, borderRadius: radius.full }]} />
      </View>
    </View>
  );
};

export const StepTimeline: React.FC<StepTimelineProps> = ({ job, onEditStep, onEditAll }) => {
  const { colors, radius } = useTheme();
  const started = !!job.acknowledgedAt;
  const currentStep = started ? STEP_SEQUENCE.find((s) => !job.steps[s]) : undefined;

  return (
    <View>
      {STEP_SEQUENCE.map((step, index) => {
        const at = job.steps[step];
        const isDone = !!at;
        const isCurrent = step === currentStep;
        const isLast = index === STEP_SEQUENCE.length - 1;
        const nextDone = !isLast && !!job.steps[STEP_SEQUENCE[index + 1]];
        const showEditAll = !!onEditAll && isDone && index === 0;
        const editHandler = showEditAll ? onEditAll : isDone && onEditStep ? () => onEditStep(step) : undefined;

        return (
          <View key={step} style={styles.row}>
            <View style={styles.rail}>
              {isCurrent ? (
                <PulseDot />
              ) : (
                <View
                  style={[
                    styles.dot,
                    {
                      borderRadius: radius.full,
                      backgroundColor: isDone ? colors.primary : colors.surface,
                      borderColor: isDone ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {isDone ? (
                    <Check size={13} color={colors.primaryForeground} strokeWidth={3} />
                  ) : null}
                </View>
              )}
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    { backgroundColor: isDone && (nextDone || STEP_SEQUENCE[index + 1] === currentStep) ? colors.primary : colors.border },
                  ]}
                />
              ) : null}
            </View>

            <View style={[styles.body, isLast ? null : styles.bodyGap]}>
              <View style={styles.titleRow}>
                <AppText
                  style={[
                    isCurrent ? styles.titleCurrent : styles.title,
                    { color: isDone || isCurrent ? colors.heading : colors.mutedForeground },
                  ]}
                  numberOfLines={1}
                >
                  {isDone ? STEP_LABELS[step].completed : TODO_LABEL[step]}
                </AppText>
                {isDone && at ? (
                  <AppText style={[styles.time, { color: colors.heading }]}>
                    {formatTimeInZone(at, job.timezone)}
                  </AppText>
                ) : null}
              </View>

              {isCurrent ? (
                <AppText style={[styles.hint, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {currentHint(job, step)}
                </AppText>
              ) : null}

              {editHandler ? (
                <Pressable
                  onPress={editHandler}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={showEditAll ? 'Edit times' : `Edit ${STEP_LABELS[step].completed} time`}
                >
                  <AppText style={[styles.edit, { color: colors.link }]}>
                    {showEditAll ? 'Edit times' : 'Edit'}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  rail: {
    width: DOT,
    alignItems: 'center',
    marginRight: 14,
  },
  dotBox: {
    width: DOT,
    height: DOT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: DOT,
    height: DOT,
  },
  dot: {
    width: DOT,
    height: DOT,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 10,
    height: 10,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 4,
    minHeight: 16,
  },
  body: {
    flex: 1,
    paddingTop: 2,
  },
  bodyGap: {
    paddingBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
  },
  titleCurrent: {
    flexShrink: 1,
    fontFamily: fontFamilies.bold,
    fontSize: 16,
  },
  time: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontFamily: fontFamilies.regular,
    fontSize: 13.5,
    marginTop: 2,
  },
  edit: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13.5,
    marginTop: 4,
  },
});
