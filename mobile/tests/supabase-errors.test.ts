import { mapSupabaseError, PERMANENT_ERROR_CODES } from '@/api/supabase-errors';
import { ApiError } from '@/api/types';

describe('mapSupabaseError', () => {
  it.each([
    ['not_operator', 'forbidden'],
    ['not_assigned', 'forbidden'],
    ['job_cancelled', 'job_cancelled'],
    ['step_out_of_order', 'step_out_of_order'],
    ['too_early', 'too_early'],
    ['ticket_locked', 'ticket_locked'],
    ['invalid_ticket', 'invalid_ticket'],
    ['invalid_time', 'invalid_time'],
    ['overlaps_previous', 'overlaps_previous'],
    ['invalid_range', 'invalid_range'],
    ['phone_not_found', 'phone_not_found'],
    ['ambiguous_phone', 'ambiguous_phone'],
  ])('maps backend message %s to %s', (message, code) => {
    expect(mapSupabaseError({ message, code: 'P0001' }).code).toBe(code);
  });

  it('keeps the reason of an invalid ticket', () => {
    const e = mapSupabaseError({ message: 'invalid_ticket', details: 'Yards pumped is required to submit.' });
    expect(e.message).toBe('Yards pumped is required to submit.');
  });

  it('finds phone_not_found inside the sign-in hook message', () => {
    const e = mapSupabaseError({ message: 'Hook requested 403: phone_not_found', status: 403 });
    expect(e.code).toBe('phone_not_found');
  });

  it('maps rate limits', () => {
    expect(mapSupabaseError({ message: 'x', status: 429 }).code).toBe('rate_limited');
    expect(mapSupabaseError({ message: 'x', code: 'over_sms_send_rate_limit' }).code).toBe('rate_limited');
  });

  it('maps a wrong or expired code', () => {
    expect(mapSupabaseError({ message: 'Token has expired or is invalid', status: 403 }).code).toBe('bad_code');
    expect(mapSupabaseError({ message: 'x', code: 'otp_expired' }).code).toBe('bad_code');
  });

  it('maps network failures to offline', () => {
    expect(mapSupabaseError({ message: 'Network request failed' }).code).toBe('offline');
    expect(mapSupabaseError({ message: 'x', name: 'AuthRetryableFetchError', status: 0 }).code).toBe('offline');
  });

  it('maps permission and not-found errors', () => {
    expect(mapSupabaseError({ message: 'permission denied', code: '42501' }).code).toBe('forbidden');
    expect(mapSupabaseError({ message: 'x', code: 'PGRST116' }).code).toBe('not_found');
  });

  it('falls back to unknown and passes ApiError through', () => {
    expect(mapSupabaseError({ message: 'boom' }).code).toBe('unknown');
    const original = new ApiError('conflict', 'c');
    expect(mapSupabaseError(original)).toBe(original);
  });

  it('does not treat offline or unknown as permanent', () => {
    expect(PERMANENT_ERROR_CODES.has('offline')).toBe(false);
    expect(PERMANENT_ERROR_CODES.has('unknown')).toBe(false);
    expect(PERMANENT_ERROR_CODES.has('ticket_locked')).toBe(true);
  });
});
