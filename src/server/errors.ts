import 'server-only';

export type ActionErrorCode =
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'DUPLICATE'
  | 'RESOURCE_CONFLICT'
  | 'INVALID'
  | 'STALE'
  | 'UNKNOWN';

export type ActionError = { code: ActionErrorCode; message: string };

/** Thrown by an action when an optimistic version check updates 0 rows. */
export class StaleVersionError extends Error {}

/** Thrown by an action when an update matched no row (missing, or hidden by RLS). */
export class NotFoundError extends Error {}

const MESSAGES: Record<ActionErrorCode, string> = {
  VALIDATION: 'Please check the highlighted fields.',
  UNAUTHENTICATED: 'Please sign in again.',
  FORBIDDEN: "You don't have permission to do that.",
  DUPLICATE: 'That already exists.',
  RESOURCE_CONFLICT: 'That time or resource is already taken.',
  INVALID: 'That change is not allowed.',
  STALE: 'Someone else changed this. Reload to see the latest.',
  UNKNOWN: 'Something went wrong. Please try again.',
};

export function actionError(code: ActionErrorCode): ActionError {
  return { code, message: MESSAGES[code] };
}

/** Maps a Postgres / PostgREST error to a typed result. Raw error text never leaves the server. */
export function mapError(error: unknown): ActionError {
  if (error instanceof StaleVersionError) return actionError('STALE');
  if (error instanceof NotFoundError) return actionError('INVALID');

  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  switch (code) {
    case '42501':
      return actionError('FORBIDDEN');
    case '23505':
      return actionError('DUPLICATE');
    case '23P01':
      return actionError('RESOURCE_CONFLICT');
    case 'P0001':
      return actionError('INVALID');
    default:
      return actionError('UNKNOWN');
  }
}
