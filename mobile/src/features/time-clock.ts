import type { ClockEntry } from '@/api/types';

export const DAY_MS = 24 * 60 * 60 * 1000;

export type ClockAction = 'clock_in' | 'clock_out';

/** Worked milliseconds of `entries` that fall inside [from, to). A running shift counts up to `now`. */
export function workedBetween(entries: ClockEntry[], from: Date, to: Date, now: number): number {
  return entries.reduce((sum, entry) => {
    const start = Math.max(new Date(entry.clockedInAt).getTime(), from.getTime());
    const end = Math.min(entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : now, to.getTime());
    return end > start ? sum + (end - start) : sum;
  }, 0);
}

export function findOpenEntry(entries: ClockEntry[]): ClockEntry | null {
  return entries.find((e) => !e.clockedOutAt) ?? null;
}

/** Midnight (phone time) to the next midnight, for the day that holds `date`. */
export function dayRange(date: Date): { from: Date; to: Date } {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { from, to: new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1) };
}

/** A week as a range [weekStart, next Monday), in phone time. */
export function weekRange(weekStart: Date): { from: Date; to: Date } {
  return {
    from: weekStart,
    to: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7),
  };
}

/**
 * What the shift list looks like once a clock tap is applied. Safe to apply twice: the same tap
 * never opens a second shift or re-closes a closed one, so it can be laid over fresh server data
 * while the tap is still waiting in the outbox.
 */
export function applyClockAction(entries: ClockEntry[], action: ClockAction, at: string): ClockEntry[] {
  const open = findOpenEntry(entries);
  if (action === 'clock_in') {
    if (open || entries.some((e) => e.clockedInAt === at)) return entries;
    const entry: ClockEntry = { id: `pending-${at}`, clockedInAt: at, clockedOutAt: null, breakMinutes: 0, jobId: null };
    return [...entries, entry];
  }
  if (!open) return entries;
  return entries.map((e) => (e === open ? { ...e, clockedOutAt: at } : e));
}

/** True when a shift from `entry` overlaps [from, to). */
export function overlapsRange(entry: ClockEntry, from: Date, to: Date, now: number): boolean {
  return (
    new Date(entry.clockedInAt).getTime() < to.getTime() &&
    (entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : now) > from.getTime()
  );
}
