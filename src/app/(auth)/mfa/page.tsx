import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { MfaEnrollScreen } from '@/components/auth/mfa-enroll-screen';
import { MfaVerifyScreen } from '@/components/auth/mfa-verify-screen';
import { isSignedIn, mfaReturnPath, mfaStep } from '@/lib/auth/guard';
import { createClient } from '@/server/supabase';

export const metadata: Metadata = {
  title: 'Two-Step Sign In · PumpDesk',
};

/** Second sign-in step: set up an authenticator app the first time, then a code on every sign-in. */
export default async function MfaPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const redirectTo = mfaReturnPath((await searchParams).next);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!isSignedIn(claims)) redirect('/login');

  // listFactors checks the user with the Auth server, so the factor list is not taken from the cookie.
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp[0];

  const step = mfaStep(claims, Boolean(factor));
  if (step === 'done') redirect(redirectTo);
  if (step === 'verify' && factor) return <MfaVerifyScreen factorId={factor.id} redirectTo={redirectTo} />;
  return <MfaEnrollScreen />;
}
