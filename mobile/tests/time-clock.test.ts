import type { ClockEntry } from '@/api/types';
import { applyClockAction, dayRange, findOpenEntry, weekRange, workedBetween } from '@/features/time-clock';

const H = 60 * 60 * 1000;
const entry = (inAt: string, outAt: string | null): ClockEntry => ({
  id: inAt,
  clockedInAt: inAt,
  clockedOutAt: outAt,
  breakMinutes: 0,
  jobId: null,
});

const day = new Date('2026-11-16T00:00:00.000Z');
const week = new Date(day.getTime() + 7 * 24 * H);

describe('workedBetween', () => {
  it('adds closed shifts', () => {
    const entries = [
      entry('2026-11-16T06:00:00.000Z', '2026-11-16T10:00:00.000Z'),
      entry('2026-11-16T11:00:00.000Z', '2026-11-16T13:30:00.000Z'),
    ];
    expect(workedBetween(entries, day, week, Date.now())).toBe(6.5 * H);
  });

  it('counts a running shift up to now', () => {
    const entries = [entry('2026-11-17T06:00:00.000Z', null)];
    const now = new Date('2026-11-17T08:30:00.000Z').getTime();
    expect(workedBetween(entries, day, week, now)).toBe(2.5 * H);
  });

  it('cuts a shift at the range edges', () => {
    const entries = [entry('2026-11-15T22:00:00.000Z', '2026-11-16T02:00:00.000Z')];
    expect(workedBetween(entries, day, week, Date.now())).toBe(2 * H);
  });

  it('ignores a running shift that has not started yet', () => {
    const entries = [entry('2026-11-17T09:00:00.000Z', null)];
    expect(workedBetween(entries, day, week, new Date('2026-11-17T08:00:00.000Z').getTime())).toBe(0);
  });
});

describe('ranges', () => {
  it('builds a day and a week in phone time', () => {
    const d = dayRange(new Date(2026, 10, 18, 14, 30));
    expect(d.from).toEqual(new Date(2026, 10, 18));
    expect(d.to).toEqual(new Date(2026, 10, 19));
    expect(weekRange(new Date(2026, 10, 16)).to).toEqual(new Date(2026, 10, 23));
  });
});

describe('applyClockAction', () => {
  it('opens a shift on clock in', () => {
    const next = applyClockAction([], 'clock_in', '2026-11-17T06:00:00.000Z');
    expect(findOpenEntry(next)?.clockedInAt).toBe('2026-11-17T06:00:00.000Z');
  });

  it('does not open a second shift', () => {
    const open = [entry('2026-11-17T06:00:00.000Z', null)];
    expect(applyClockAction(open, 'clock_in', '2026-11-17T07:00:00.000Z')).toBe(open);
  });

  it('does not duplicate a tap the server already has', () => {
    const closed = [entry('2026-11-17T06:00:00.000Z', '2026-11-17T10:00:00.000Z')];
    expect(applyClockAction(closed, 'clock_in', '2026-11-17T06:00:00.000Z')).toBe(closed);
  });

  it('closes the open shift on clock out', () => {
    const next = applyClockAction([entry('2026-11-17T06:00:00.000Z', null)], 'clock_out', '2026-11-17T10:00:00.000Z');
    expect(next[0].clockedOutAt).toBe('2026-11-17T10:00:00.000Z');
  });

  it('leaves closed shifts alone on clock out', () => {
    const closed = [entry('2026-11-17T06:00:00.000Z', '2026-11-17T10:00:00.000Z')];
    expect(applyClockAction(closed, 'clock_out', '2026-11-17T11:00:00.000Z')).toBe(closed);
  });
});
