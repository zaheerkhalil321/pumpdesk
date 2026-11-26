'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthTicket } from '@/components/auth/auth-ticket';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthFormAlert } from '@/components/auth/auth-form-alert';
import { MfaCodeForm } from '@/components/auth/mfa-code-form';
import { MfaSignOutLink } from '@/components/auth/mfa-sign-out-link';
import { startEnrollment, type TotpEnrollment } from '@/lib/auth/mfa-service';

/** "ABCD EFGH ..." is easier to type into an app by hand than one long string. */
function groupSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') ?? secret;
}

function EnrollmentKey({ enrollment }: { enrollment: TotpEnrollment }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-muted/40 p-4">
      {/* An SVG data URI from Supabase, so next/image has nothing to optimise. The white tile keeps it scannable in dark mode. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={enrollment.qrCode}
        alt="QR code for your authenticator app"
        className="size-44 rounded-md bg-white p-2"
      />
      <div className="flex w-full flex-col gap-1 text-center">
        <span className="text-xs text-muted-foreground">Can&apos;t scan it? Type this key instead:</span>
        <span className="flex items-center justify-center gap-1.5">
          <code className="break-all font-mono text-sm font-semibold tracking-wide text-foreground">
            {groupSecret(enrollment.secret)}
          </code>
          <CopyButton value={enrollment.secret} label="Key" />
        </span>
      </div>
    </div>
  );
}

/** First sign-in with two-step on: scan the QR code, then prove it works with one code. */
export function MfaEnrollScreen() {
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const load = useCallback(() => {
    setError(null);
    startEnrollment().then((result) => {
      if (result.ok) setEnrollment(result.data);
      else setError(result.error);
    });
  }, []);

  useEffect(() => {
    // Once per mount, even when React runs effects twice in development.
    if (started.current) return;
    started.current = true;
    load();
  }, [load]);

  return (
    <AuthTicket
      label="Set Up 2-Step"
      stub={
        <span>
          Required for every PumpDesk user. <MfaSignOutLink />
        </span>
      }
    >
      <div className="flex flex-col gap-6">
        <AuthHeader
          title="Protect Your Account"
          description="Scan this code with an authenticator app such as Google Authenticator, 1Password or Authy. Then enter the 6-digit code it shows."
        />

        {error && (
          <div className="flex flex-col gap-3">
            <AuthFormAlert message={error} />
            <Button type="button" variant="outline" onClick={load}>
              <RotateCcw className="size-4" />
              Try Again
            </Button>
          </div>
        )}

        {!error && !enrollment && <Skeleton className="h-72 w-full rounded-lg" />}

        {enrollment && (
          <>
            <EnrollmentKey enrollment={enrollment} />
            <MfaCodeForm factorId={enrollment.factorId} submitLabel="Turn On 2-Step" autoFocus={false} />
          </>
        )}
      </div>
    </AuthTicket>
  );
}
