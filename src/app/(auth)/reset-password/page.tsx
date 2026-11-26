import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { isSignedIn, MFA_PATH, mfaStep } from '@/lib/auth/guard';
import { createClient } from '@/server/supabase';

export const metadata: Metadata = {
  title: 'Set A New Password · PumpDesk',
};

/**
 * Supabase only lets a user with an authenticator app change the password after the
 * code step (aal2), so the reset link asks for the code first and comes back here.
 */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (isSignedIn(data?.claims)) {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (mfaStep(data?.claims, Boolean(factors?.totp[0])) === 'verify') {
      redirect(`${MFA_PATH}?next=/reset-password`);
    }
  }
  return <ResetPasswordForm />;
}
