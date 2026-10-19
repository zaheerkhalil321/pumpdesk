/**
 * Auth service boundary.
 *
 * The UI only talks to these functions. They call Supabase Auth through the browser
 * client and turn every failure into a plain message (raw error text is never shown).
 */

import { createClient } from '@/lib/supabase-browser';

export type AuthResult = { ok: true } | { ok: false; error: string };

const GENERIC_ERROR = 'Something went wrong. Please try again.';

function signInMessage(code: string | undefined, status: number | undefined): string {
  if (code === 'invalid_credentials') return 'Incorrect email or password.';
  if (code === 'over_request_rate_limit' || status === 429) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (code === 'user_banned') return 'This account has been suspended. Contact your admin.';
  return GENERIC_ERROR;
}

export async function signIn(credentials: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<AuthResult> {
  // rememberMe is kept for the form, but Supabase can't honour it per session.
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error) return { ok: false, error: signInMessage(error.code, error.status) };
  return { ok: true };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
  });
  // Always succeed so the UI never reveals whether an account exists.
  return { ok: true };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if (error.code === 'same_password') {
      return { ok: false, error: 'Choose a password you have not used before.' };
    }
    if (error.code === 'weak_password') {
      return { ok: false, error: 'That password is too weak. Try a longer one.' };
    }
    return { ok: false, error: GENERIC_ERROR };
  }
  return { ok: true };
}

/** Confirms the signed-in user has an active company membership before entering the app. */
export async function loadWorkspace(): Promise<AuthResult> {
  const supabase = createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;

  if (userId) {
    const { data } = await supabase
      .from('company_memberships')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1);
    if (data && data.length > 0) return { ok: true };
  }

  await supabase.auth.signOut();
  return { ok: false, error: 'Your account is not active in any company.' };
}

export async function signOut(): Promise<AuthResult> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: GENERIC_ERROR };
  return { ok: true };
}
