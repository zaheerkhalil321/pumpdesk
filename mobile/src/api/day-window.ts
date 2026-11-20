import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { DEFAULT_TIMEZONE } from '@/lib/dates';

export interface DayWindow {
  from: string; // ISO instant, inclusive
  to: string; // ISO instant, exclusive
}

/** Midnight (in `timeZone`) that starts the calendar day `offsetDays` after the day `now` falls on. */
function dayStart(now: Date, offsetDays: number, timeZone: string): Date {
  const [y, m, d] = formatInTimeZone(now, timeZone, 'yyyy-MM-dd').split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + offsetDays));
  const key = shifted.toISOString().slice(0, 10);
  return fromZonedTime(`${key}T00:00:00`, timeZone);
}

/** Today, in the jobs' time zone: [midnight, next midnight). */
export function todayWindow(now: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): DayWindow {
  return {
    from: dayStart(now, 0, timeZone).toISOString(),
    to: dayStart(now, 1, timeZone).toISOString(),
  };
}

/** Tomorrow up to and including the day `days` from now. */
export function upcomingWindow(
  days: number,
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIMEZONE
): DayWindow {
  return {
    from: dayStart(now, 1, timeZone).toISOString(),
    to: dayStart(now, Math.max(1, days) + 1, timeZone).toISOString(),
  };
}
