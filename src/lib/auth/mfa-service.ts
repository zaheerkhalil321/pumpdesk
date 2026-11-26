/**
 * Two-step sign-in (authenticator app) through Supabase Auth MFA, from the browser.
 *
 * Like auth-service, every failure becomes a plain message. The server never trusts
 * these calls: the proxy and getSession read the aal claim from the verified token.
 */

import { createClient } from '@/lib/supabase-browser';

const GENERIC_ERROR = 'Something went wrong. Please try again.';
/** Shown by the authenticator app next to the six-digit code. */
const ISSUER = 'PumpDesk';

export type MfaResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export type TotpEnrollment = {
  factorId: string;
  /** SVG data URI from Supabase, shown as the QR code. */
  qrCode: string;
  /** The same key as text, for typing into the app by hand. */
  secret: string;
};

export type VerifiedFactor = { id: string; createdAt: string };

function codeMessage(code: string | undefined, status: number | undefined): string {
  if (code === 'mfa_verification_failed') return 'That code is not right. Check the app and try again.';
  if (code === 'mfa_challenge_expired') return 'That code expired. Enter the newest one from the app.';
  if (code === 'over_request_rate_limit' || status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  // Passing the code step in another tab or browser ends this password-only session.
  if (code === 'session_not_found' || code === 'session_expired') {
    return 'This sign-in has ended. Sign out and sign in again.';
  }
  return GENERIC_ERROR;
}

/** The user's verified authenticator app, or null when none is set up. */
export async function getVerifiedFactor(): Promise<MfaResult<VerifiedFactor | null>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { ok: false, error: GENERIC_ERROR };
  const factor = data.totp[0];
  return { ok: true, data: factor ? { id: factor.id, createdAt: factor.created_at } : null };
}

/**
 * Starts setting up an authenticator app. Half-finished set-ups from earlier visits are
 * removed first, so a reload never hits the factor limit or a name clash.
 */
export async function startEnrollment(): Promise<MfaResult<TotpEnrollment>> {
  const supabase = createClient();
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
  if (listError) return { ok: false, error: GENERIC_ERROR };

  for (const factor of factors.all) {
    if (factor.factor_type === 'totp' && factor.status === 'unverified') {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: ISSUER,
    friendlyName: `Authenticator app ${new Date().toISOString()}`,
  });
  if (error) {
    if (error.code === 'mfa_totp_enroll_not_enabled') {
      return { ok: false, error: 'Authenticator apps are turned off in Supabase Auth. Ask your admin to turn them on.' };
    }
    return { ok: false, error: GENERIC_ERROR };
  }
  return { ok: true, data: { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret } };
}

/** Checks a six-digit code. On success the session moves up to aal2. */
export async function verifyCode(factorId: string, code: string): Promise<MfaResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { ok: false, error: codeMessage(error.code, error.status) };
  return { ok: true, data: undefined };
}

/**
 * Removes the user's authenticator app (for a new phone). Supabase drops the session back
 * to aal1, so the refreshed session is sent to set up a new app before anything else.
 */
export async function resetAuthenticator(): Promise<MfaResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { ok: false, error: GENERIC_ERROR };

  for (const factor of data.all) {
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (unenrollError) return { ok: false, error: GENERIC_ERROR };
  }
  await supabase.auth.refreshSession();
  return { ok: true, data: undefined };
}
