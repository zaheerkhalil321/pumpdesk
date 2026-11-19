import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Timer } from 'lucide-react-native';
import { AppText } from '@/components/ui';
import { OperatorJob, JobStep } from '@/api/types';
import { getJobProgressState } from '@/features/steps';
import { formatElapsed } from '@/lib/dates';
import { useTheme } from '@/theme';
import { fontFamilies } from '@/theme/typography';

export interface JobProgressHeroProps {
  job: OperatorJob;
  /** Status badge shown at the left of the top row. */
  badge: React.ReactNode;
}

// Which step the running timer counts from, and what it is called.
const TIMER_BY_STATE: Partial<Record<ReturnType<typeof getJobProgressState>, [JobStep, string]>> = {
  arrived_shop: ['arrived_shop', 'At shop'],
  departed_shop: ['departed_shop', 'En route'],
  arrived_site: ['arrived_site', 'On site'],
};

export const JobProgressHero: React.FC<JobProgressHeroProps> = ({ job, badge }) => {
  const { colors, radius } = useTheme();
  const [now, setNow] = useState(() => Date.now());

  const state = getJobProgressState(job);
  const timer = TIMER_BY_STATE[state];
  const startIso = timer ? job.steps[timer[0]] : null;

  useEffect(() => {
    if (!startIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startIso]);

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        {badge}
        {timer && startIso ? (
          <View
            style={[styles.timer, { backgroundColor: colors.primary, borderRadius: radius.full }]}
            accessibilityRole="timer"
            accessibilityLabel={`${timer[1]} for ${formatElapsed(now - new Date(startIso).getTime())}`}
          >
            <Timer size={14} color={colors.primaryForeground} strokeWidth={2.4} />
            <AppText style={[styles.timerText, { color: colors.primaryForeground }]}>
              {timer[1]} {formatElapsed(now - new Date(startIso).getTime())}
            </AppText>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timerText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
