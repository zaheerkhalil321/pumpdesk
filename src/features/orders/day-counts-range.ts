import { endOfMonth, endOfWeek, format, max, min, startOfMonth, startOfWeek } from 'date-fns';

/**
 * The days whose job counts the Schedule loads with a page: every day of the month calendar
 * (Sunday weeks) and of the week row (Monday weeks) around `date`. Both yyyy-MM-dd.
 */
export function countsRangeFor(date: Date): { from: string; to: string } {
  const first = startOfMonth(date);
  const last = endOfMonth(date);
  const from = min([startOfWeek(first), startOfWeek(first, { weekStartsOn: 1 })]);
  const to = max([endOfWeek(last), endOfWeek(last, { weekStartsOn: 1 })]);
  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}
