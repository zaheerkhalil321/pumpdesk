/**
 * Two-step sign-in rules, kept free of Next and Supabase so they can be unit tested.
 *
 * Every web dashboard user must finish two-step sign-in (an authenticator app code).
 * A session is only "full" at aal2. An aal1 session (password only) can reach the
 * code screen and nothing else.
 */

/** The code screen. It sets up the app the first time and asks for a code after that. */
export const MFA_PATH = '/mfa';

/** Pages that work without any session: sign-in, password reset and the email link. */
const PUBLIC_AUTH_PATHS = ['/login', '/forgot-password', '/reset-password', '/auth'];

function matches(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some((p) => matches(pathname, p));
}

/** The claims the guard reads from the verified access token. */
export type GuardClaims = { sub?: unknown; aal?: unknown } | null | undefined;

export function isSignedIn(claims: GuardClaims): boolean {
  return typeof claims?.sub === 'string' && claims.sub.length > 0;
}

/** True when the session has passed the code step. */
export function hasFullSession(claims: GuardClaims): boolean {
  return isSignedIn(claims) && claims?.aal === 'aal2';
}

export type GuardDecision = 'allow' | 'login' | 'mfa';

/** What the proxy does with a request: let it through, or send it to sign-in or the code screen. */
export function guardRoute(pathname: string, claims: GuardClaims): GuardDecision {
  if (isPublicAuthPath(pathname)) return 'allow';
  if (!isSignedIn(claims)) return 'login';
  if (matches(pathname, MFA_PATH)) return 'allow';
  return hasFullSession(claims) ? 'allow' : 'mfa';
}

/** Where the code screen goes after a right code. Only known pages, never a link from the address bar. */
const MFA_RETURN_PATHS = ['/reset-password'];
export const MFA_DEFAULT_RETURN = '/schedule';

export function mfaReturnPath(next: unknown): string {
  return typeof next === 'string' && MFA_RETURN_PATHS.includes(next) ? next : MFA_DEFAULT_RETURN;
}

export type MfaStep = 'done' | 'verify' | 'enroll';

/** What the code screen shows: a user with a verified app gets the code prompt, everyone else sets one up. */
export function mfaStep(claims: GuardClaims, hasVerifiedFactor: boolean): MfaStep {
  if (hasFullSession(claims)) return 'done';
  return hasVerifiedFactor ? 'verify' : 'enroll';
}
