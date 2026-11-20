import type { ProfileStat } from '@/components/profile/ProfileStats';
import { useTodayJobs } from './useJobs';
import { useTimeClock } from './useTimeClock';
import { formatHoursMinutes } from '@/lib/dates';

/** Jobs done today, tickets sent today, hours this week (the running shift counts up to now). */
export function useProfileStats(): ProfileStat[] {
  const { data: todayJobs = [] } = useTodayJobs();
  const { workedWeek } = useTimeClock();

  const done = todayJobs.filter((j) => !!j.steps.departed_site).length;
  const tickets = todayJobs.filter((j) => j.ticketStatus === 'submitted').length;

  return [
    { value: `${done}/${todayJobs.length}`, label: 'Jobs today' },
    { value: String(tickets), label: 'Tickets sent' },
    { value: formatHoursMinutes(workedWeek), label: 'This week' },
  ];
}
