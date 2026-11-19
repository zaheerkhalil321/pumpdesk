import { useState } from 'react';
import type { ProfileStat } from '@/components/profile/ProfileStats';
import { useTodayJobs } from './useJobs';
import { useTimeClock, workedBetween } from './useTimeClock';
import { formatHoursMinutes, startOfWeekMonday } from '@/lib/dates';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Jobs done today, tickets sent today, hours this week. */
export function useProfileStats(): ProfileStat[] {
  const { data: todayJobs = [] } = useTodayJobs();
  const { entries } = useTimeClock();
  const [now] = useState(() => Date.now());

  const done = todayJobs.filter((j) => !!j.steps.departed_site).length;
  const tickets = todayJobs.filter((j) => j.ticketStatus === 'submitted').length;
  const weekStart = startOfWeekMonday(new Date(now));
  const hours = workedBetween(entries, weekStart, new Date(weekStart.getTime() + WEEK_MS), now);

  return [
    { value: `${done}/${todayJobs.length}`, label: 'Jobs today' },
    { value: String(tickets), label: 'Tickets sent' },
    { value: formatHoursMinutes(hours), label: 'This week' },
  ];
}
