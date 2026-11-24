import type { FieldStatus, ScheduleBooking } from '@/components/schedule/schedule-types';

/**
 * How a card looks right now on the board:
 *  - live: the crew is out on this job (left the shop, on site, pumping, heading back)
 *  - late: pour time has come and the crew is not on site yet
 *  - done: the operator finished or turned in the ticket
 *  - idle: nothing is happening yet
 */
export type LiveState = 'idle' | 'live' | 'late' | 'done';

/** The board's clock: the company's date (yyyy-MM-dd) and hour of day (10.5 = 10:30 AM). */
export type BoardNow = { date: string; hour: number };

const OUT_IN_FIELD: ReadonlySet<FieldStatus> = new Set(['en_route', 'on_site', 'pumping', 'washout', 'returning']);
const NOT_ON_SITE: ReadonlySet<FieldStatus> = new Set(['scheduled', 'en_route']);

const STAGE_LABELS: Record<FieldStatus, string> = {
  scheduled: 'Scheduled',
  en_route: 'En Route',
  on_site: 'On Site',
  pumping: 'Pumping',
  washout: 'Washout',
  returning: 'Returning',
  done: 'Done',
};

export function liveStateOf(booking: ScheduleBooking, now: BoardNow | null): LiveState {
  const status = booking.fieldStatus ?? 'scheduled';
  if (status === 'done' || booking.hasTicket) return 'done';

  const isToday = now !== null && booking.serviceDate === now.date;
  // Only a job with an operator can be late: an empty one already shows "No Operator" in red.
  if (isToday && booking.operator && NOT_ON_SITE.has(status) && now.hour >= booking.pourHour) return 'late';
  if (OUT_IN_FIELD.has(status)) return 'live';
  return 'idle';
}

/**
 * The badge colour group. Each stage has its own colour, separate from the company's brand colour:
 * en route (blue), on site (violet), heading back (orange), late (rose), done (grey with a tick).
 */
export type StageTone = 'en_route' | 'on_site' | 'returning' | 'late' | 'done';

export function stageToneOf(booking: ScheduleBooking, state: LiveState): StageTone {
  if (state === 'late') return 'late';
  if (state === 'done') return 'done';
  const status = booking.fieldStatus ?? 'scheduled';
  if (status === 'en_route') return 'en_route';
  if (status === 'returning') return 'returning';
  return 'on_site';
}

/** The words on the card's live badge, e.g. "En Route" or "Late · Not On Site". */
export function stageLabelOf(booking: ScheduleBooking, state: LiveState): string {
  const status = booking.fieldStatus ?? 'scheduled';
  if (state === 'late') return status === 'en_route' ? 'Late · En Route' : 'Late · Not On Site';
  return STAGE_LABELS[status];
}

/**
 * How far through the whole block (prep to clean-up) the job is, in steps of 5 (0 to 100).
 * Null when the card is not shown for today, so no progress bar.
 */
export function progressStepOf(booking: ScheduleBooking, now: BoardNow | null): number | null {
  if (!now || booking.serviceDate !== now.date || booking.durationHours <= 0) return null;
  const share = (now.hour - booking.startHour) / booking.durationHours;
  return Math.round(Math.min(1, Math.max(0, share)) * 20) * 5;
}
