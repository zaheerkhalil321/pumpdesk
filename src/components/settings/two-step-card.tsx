'use client';

import { useEffect, useState, useTransition } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MFA_PATH } from '@/lib/auth/guard';
import { getVerifiedFactor, resetAuthenticator, type VerifiedFactor } from '@/lib/auth/mfa-service';

const TIME_ZONE = 'America/Chicago';

/**
 * The signed-in user's own two-step sign-in. It is always on, so the only action is
 * moving it to a new phone: remove the app, then set up a new one straight away.
 */
export function TwoStepCard() {
  const [factor, setFactor] = useState<VerifiedFactor | null>(null);
  const [open, setOpen] = useState(false);
  const [isResetting, startResetting] = useTransition();

  useEffect(() => {
    getVerifiedFactor().then((result) => {
      if (result.ok) setFactor(result.data);
    });
  }, []);

  const handleReset = () => {
    startResetting(async () => {
      const result = await resetAuthenticator();
      if (!result.ok) {
        toast.error('Could not reset your authenticator app', { description: result.error });
        return;
      }
      // A full load, so the server sees the aal1 session and shows the set-up screen.
      window.location.assign(MFA_PATH);
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-2xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground sm:text-base">Two-step sign-in</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              On for your account. You enter a code from your authenticator app each time you sign in.
              {factor && ` Set up ${formatInTimeZone(factor.createdAt, TIME_ZONE, 'MMM d, yyyy')}.`}
            </p>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="shrink-0">
          <RotateCcw className="size-3.5" />
          New phone
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={(next) => !isResetting && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-orange-50 text-orange-600">
              <RotateCcw />
            </AlertDialogMedia>
            <AlertDialogTitle>Move to a new phone?</AlertDialogTitle>
            <AlertDialogDescription>
              Your current authenticator app stops working. You will scan a new QR code right away, before you can use
              PumpDesk again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={isResetting}>
              {isResetting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Set up new phone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
