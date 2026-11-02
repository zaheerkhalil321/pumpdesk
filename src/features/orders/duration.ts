/** Prep before the pour and clean-up after it, in minutes. */
export const PREP_MINUTES = 30;
export const CLEANUP_MINUTES = 30;

const BASE_MINUTES = 60;
const MINUTES_PER_YARD = 1.5;
const STEP_MINUTES = 15;

/**
 * How long the pour takes: 60 minutes + 1.5 minutes per yard, to the nearest 15 minutes
 * (halfway rounds up, so 5 yards is 1 hr 15 min). Prep and clean-up are not included.
 */
export function pumpMinutesFor(yards: number): number {
  const safeYards = Number.isFinite(yards) && yards > 0 ? yards : 0;
  const raw = BASE_MINUTES + safeYards * MINUTES_PER_YARD;
  return Math.round(raw / STEP_MINUTES) * STEP_MINUTES;
}

/** "1 hr 15 min", "2 hr", "45 min". */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}
