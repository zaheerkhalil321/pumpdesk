import { ApiError, ApiErrorCode } from './types';
import { parseRetryAfter } from '@/features/otp';

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  details?: string | null;
  hint?: string | null;
  name?: string;
}

// Backend error messages (the RPCs raise "message = a short code") that map one to one.
const BACKEND_CODES: Record<string, ApiErrorCode> = {
  not_operator: 'forbidden',
  not_assigned: 'forbidden',
  membership_inactive: 'forbidden',
  phone_already_linked: 'forbidden',
  phone_not_found: 'phone_not_found',
  ambiguous_phone: 'ambiguous_phone',
  job_cancelled: 'job_cancelled',
  step_out_of_order: 'step_out_of_order',
  step_not_recorded: 'conflict',
  too_early: 'too_early',
  ticket_locked: 'ticket_locked',
  invalid_ticket: 'invalid_ticket',
  invalid_time: 'invalid_time',
  overlaps_previous: 'overlaps_previous',
  invalid_range: 'invalid_range',
};

const MESSAGES: Record<ApiErrorCode, string> = {
  not_found: 'We could not find that.',
  phone_not_found: "We couldn't find this number. Ask dispatch to add it.",
  ambiguous_phone: 'This number is on more than one account. Ask dispatch to fix it.',
  bad_code: "That code didn't work. Try again.",
  rate_limited: 'Too many tries. Wait a minute and try again.',
  offline: 'No connection. Check your signal and try again.',
  forbidden: 'You do not have access to this job.',
  conflict: 'That could not be saved. Try again.',
  job_cancelled: 'Dispatch cancelled this job.',
  step_out_of_order: 'That step is out of order.',
  too_early: 'This job is not for today yet.',
  ticket_locked: 'This ticket was already turned in.',
  invalid_ticket: 'The ticket is missing something.',
  invalid_time: 'That time is not valid.',
  overlaps_previous: 'That time overlaps your last shift.',
  invalid_range: 'That date range is too long.',
  unknown: 'Something went wrong. Try again.',
};

/** Errors that will never succeed on retry. The outbox drops these instead of retrying forever. */
export const PERMANENT_ERROR_CODES: ReadonlySet<ApiErrorCode> = new Set([
  'forbidden',
  'job_cancelled',
  'step_out_of_order',
  'too_early',
  'ticket_locked',
  'invalid_ticket',
  'invalid_time',
  'overlaps_previous',
  'invalid_range',
]);

function isNetworkFailure(e: ErrorLike): boolean {
  const msg = (e.message ?? '').toLowerCase();
  return (
    e.status === 0 ||
    e.name === 'AuthRetryableFetchError' ||
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('network error')
  );
}

/** Turns anything the Supabase client throws or returns into an ApiError with an app code. */
export function mapSupabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const e = (error ?? {}) as ErrorLike;
  const message = (e.message ?? '').trim();

  const backend = BACKEND_CODES[message];
  if (backend) return build(backend, message === 'invalid_ticket' ? e.details : null);

  // Sign-in hook rejection: GoTrue wraps the hook's message, so look for the code inside it.
  const lower = message.toLowerCase();
  if (lower.includes('phone_not_found')) return build('phone_not_found');

  if (
    e.status === 429 ||
    e.code === 'over_sms_send_rate_limit' ||
    e.code === 'over_request_rate_limit' ||
    lower.includes('for security purposes, you can only request this after')
  ) {
    const err = build('rate_limited');
    err.retryAfterSeconds = parseRetryAfter(message);
    return err;
  }
  if (
    e.code === 'otp_expired' ||
    e.code === 'invalid_credentials' ||
    lower.includes('token has expired or is invalid') ||
    lower.includes('otp')
  ) {
    return build('bad_code');
  }
  if (isNetworkFailure(e)) return build('offline');
  if (e.status === 401 || e.status === 403 || e.code === '42501') return build('forbidden');
  if (e.code === 'PGRST116' || e.status === 404) return build('not_found');
  return build('unknown', message || null);
}

function build(code: ApiErrorCode, detail?: string | null): ApiError {
  const text = code === 'invalid_ticket' && detail ? detail : MESSAGES[code];
  return new ApiError(code, text);
}
