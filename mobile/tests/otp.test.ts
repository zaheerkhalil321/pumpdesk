import {
  RESEND_SECONDS,
  formatCountdown,
  parseRetryAfter,
  secondsUntilResend,
  sentAtFromRetryAfter,
} from '../src/features/otp';

describe('OTP resend timer', () => {
  it('matches Supabase: one code per 60 seconds', () => {
    expect(RESEND_SECONDS).toBe(60);
  });

  it('counts down from when the code was sent', () => {
    const sent = 1_000_000;
    expect(secondsUntilResend(sent, sent)).toBe(60);
    expect(secondsUntilResend(sent, sent + 18_200)).toBe(42);
    expect(secondsUntilResend(sent, sent + 60_000)).toBe(0);
    expect(secondsUntilResend(sent, sent + 90_000)).toBe(0);
    expect(secondsUntilResend(null, sent)).toBe(0);
  });

  it('formats as m:ss', () => {
    expect(formatCountdown(60)).toBe('1:00');
    expect(formatCountdown(42)).toBe('0:42');
    expect(formatCountdown(5)).toBe('0:05');
  });

  it('follows the wait the server asks for', () => {
    expect(parseRetryAfter('For security purposes, you can only request this after 42 seconds.')).toBe(42);
    expect(parseRetryAfter('something else')).toBeNull();
    const now = 5_000_000;
    expect(secondsUntilResend(sentAtFromRetryAfter(42, now), now)).toBe(42);
  });
});
