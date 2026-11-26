import { AuthTicket } from '@/components/auth/auth-ticket';
import { AuthHeader } from '@/components/auth/auth-header';
import { MfaCodeForm } from '@/components/auth/mfa-code-form';
import { MfaSignOutLink } from '@/components/auth/mfa-sign-out-link';

/** The code prompt after password sign-in, for a user who already set up an app. */
export function MfaVerifyScreen({ factorId, redirectTo }: { factorId: string; redirectTo: string }) {
  return (
    <AuthTicket
      label="Step 2/2"
      stub={
        <span>
          Lost your phone? Contact PumpDesk support. <MfaSignOutLink />
        </span>
      }
    >
      <div className="flex flex-col gap-7">
        <AuthHeader
          title="Enter Your Code"
          description="Open your authenticator app and type the 6-digit code for PumpDesk."
        />
        <MfaCodeForm factorId={factorId} submitLabel="Verify" redirectTo={redirectTo} />
      </div>
    </AuthTicket>
  );
}
