import { format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const DEFAULT_TIMEZONE = 'America/New_York';

export function formatTimeInZone(
  isoDate: string | Date,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  try {
    const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
    const zoned = toZonedTime(date, timeZone);
    return format(zoned, 'h:mm a');
  } catch {
    return '';
  }
}

export function formatDateInZone(
  isoDate: string | Date,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  try {
    const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
    const zoned = toZonedTime(date, timeZone);
    return format(zoned, 'EEEE, MMMM d');
  } catch {
    return '';
  }
}

export function formatShortDateInZone(
  isoDate: string | Date,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  try {
    const date = typeof isoDate === 'string' ? new Date(isoDate) : isoDate;
    const zoned = toZonedTime(date, timeZone);
    return format(zoned, 'MMM d');
  } catch {
    return '';
  }
}

export function isSameDayInZone(
  iso1: string | Date,
  iso2: string | Date,
  timeZone: string = DEFAULT_TIMEZONE
): boolean {
  try {
    const d1 = typeof iso1 === 'string' ? new Date(iso1) : iso1;
    const d2 = typeof iso2 === 'string' ? new Date(iso2) : iso2;
    const z1 = toZonedTime(d1, timeZone);
    const z2 = toZonedTime(d2, timeZone);
    return (
      z1.getFullYear() === z2.getFullYear() &&
      z1.getMonth() === z2.getMonth() &&
      z1.getDate() === z2.getDate()
    );
  } catch {
    return false;
  }
}

// The native time picker shows the phone's local clock. To show a time in the job's time zone, we
// hand it a Date whose local clock reads the job-zone wall time, and convert back when saving.
export function toPickerDate(
  iso: string | Date | null | undefined,
  timeZone: string = DEFAULT_TIMEZONE
): Date {
  const date = iso ? (typeof iso === 'string' ? new Date(iso) : iso) : new Date();
  return toZonedTime(date, timeZone);
}

export function fromPickerDate(
  pickerDate: Date,
  timeZone: string = DEFAULT_TIMEZONE
): string {
  return fromZonedTime(pickerDate, timeZone).toISOString();
}

/** Elapsed time as "M:SS" or "H:MM:SS" (never negative). */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

/** Worked time as "0h 00m". */
export function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** A Monday-to-Sunday week as "Sep 21–27, 2026" or "Nov 30 – Dec 6, 2026". */
export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const startLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()}`;
  if (weekStart.getMonth() === end.getMonth()) {
    return `${startLabel}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startLabel} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

/** Monday 00:00 (local time) of the week that holds `date`. */
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Phone-local day label, e.g. "Thu, Nov 19" (time clock is in the phone's own time). */
export function formatLocalDayLabel(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** Phone-local clock time, e.g. "6:02 AM". */
export function formatLocalTime(iso: string): string {
  return format(new Date(iso), 'h:mm a');
}
