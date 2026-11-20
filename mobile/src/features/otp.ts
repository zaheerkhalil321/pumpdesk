/**
 * Supabase Auth sends at most one SMS code per number every 60 seconds
 * (its default "minimum interval" for phone OTP). The resend timer uses the same
 * number, so the button only turns on when a resend will actually go through.
 */
export const RESEND_SECONDS = 60;

/** Whole seconds left before a new code may be asked for (0 = now). */
export function secondsUntilResend(sentAt: number | null, now: number): number {
  if (sentAt === null) return 0;
  return Math.max(0, Math.ceil((sentAt + RESEND_SECONDS * 1000 - now) / 1000));
}

/** "1:00", "0:42", "0:05". */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** When the server says "only request this after 42 seconds", treat the code as sent at the matching time. */
export function sentAtFromRetryAfter(retryAfterSeconds: number, now: number): number {
  return now - (RESEND_SECONDS - Math.min(retryAfterSeconds, RESEND_SECONDS)) * 1000;
}

/** Reads "... after 42 seconds" out of a Supabase rate-limit message. */
export function parseRetryAfter(message: string): number | null {
  const match = /after (\d+) seconds?/i.exec(message);
  return match ? Number(match[1]) : null;
}
