import {
  formatTimeInZone,
  formatDateInZone,
  formatElapsed,
  formatHoursMinutes,
  formatWeekRange,
  startOfWeekMonday,
  isSameDayInZone,
  toPickerDate,
  fromPickerDate,
  DEFAULT_TIMEZONE,
} from '../src/lib/dates';

describe('Date & Timezone Utilities', () => {
  it('formats time in America/New_York zone correctly', () => {
    // 2026-09-25 14:30 UTC is 10:30 AM EDT
    const utcString = '2026-09-25T14:30:00.000Z';
    expect(formatTimeInZone(utcString, DEFAULT_TIMEZONE)).toBe('10:30 AM');
  });

  it('formats full date in specified timezone', () => {
    const utcString = '2026-09-25T14:30:00.000Z';
    expect(formatDateInZone(utcString, DEFAULT_TIMEZONE)).toBe('Friday, September 25');
  });

  it('identifies same calendar day in specified timezone', () => {
    const morning = '2026-09-25T11:00:00.000Z'; // 7:00 AM EDT
    const evening = '2026-09-25T23:00:00.000Z'; // 7:00 PM EDT
    const nextDay = '2026-09-26T11:00:00.000Z';

    expect(isSameDayInZone(morning, evening, DEFAULT_TIMEZONE)).toBe(true);
    expect(isSameDayInZone(morning, nextDay, DEFAULT_TIMEZONE)).toBe(false);
  });

  it('shows the recorded time on the picker in the job time zone', () => {
    // 14:30 UTC is 10:30 AM EDT, whatever the phone's own time zone is
    const picker = toPickerDate('2026-09-25T14:30:00.000Z', DEFAULT_TIMEZONE);
    expect(picker.getHours()).toBe(10);
    expect(picker.getMinutes()).toBe(30);
  });

  it('saves a picked time back as the right instant in the job time zone', () => {
    const picker = toPickerDate('2026-09-25T14:30:00.000Z', DEFAULT_TIMEZONE);
    picker.setHours(11, 15, 0, 0); // operator picks 11:15 AM
    expect(fromPickerDate(picker, DEFAULT_TIMEZONE)).toBe('2026-09-25T15:15:00.000Z');
  });

  it('round-trips an unchanged time, including across daylight saving', () => {
    const winter = '2026-01-15T17:05:00.000Z';
    expect(fromPickerDate(toPickerDate(winter, 'America/Chicago'), 'America/Chicago')).toBe(winter);
    const summer = '2026-07-15T17:05:00.000Z';
    expect(fromPickerDate(toPickerDate(summer, 'America/Chicago'), 'America/Chicago')).toBe(summer);
  });

  it('formats elapsed time and never goes negative', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(65_000)).toBe('1:05');
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
    expect(formatElapsed(-5000)).toBe('0:00');
  });

  it('formats worked time as hours and minutes', () => {
    expect(formatHoursMinutes(0)).toBe('0h 00m');
    expect(formatHoursMinutes(95 * 60000)).toBe('1h 35m');
  });

  it('builds Monday-start week ranges', () => {
    const monday = startOfWeekMonday(new Date(2026, 8, 25)); // Fri Sep 25, 2026
    expect(monday.getDate()).toBe(21);
    expect(formatWeekRange(monday)).toBe('Sep 21–27, 2026');
    expect(formatWeekRange(new Date(2026, 10, 30))).toBe('Nov 30 – Dec 6, 2026');
  });
});
