'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { LoadingOverlay } from '@/components/ui/loader';
import { AuthFormAlert } from '@/components/auth/auth-form-alert';
import { AuthSubmitButton } from '@/components/auth/auth-submit-button';
import { AUTH_INPUT_CLASS } from '@/components/auth/auth-styles';
import { mfaCodeSchema, type MfaCodeInput, type MfaCodeValues } from '@/lib/auth/schemas';
import { verifyCode } from '@/lib/auth/mfa-service';
import { MFA_DEFAULT_RETURN } from '@/lib/auth/guard';
import { cn } from '@/lib/utils';

interface MfaCodeFormProps {
  factorId: string;
  submitLabel: string;
  autoFocus?: boolean;
  /** Where a right code goes. Defaults to the dispatch board. */
  redirectTo?: string;
}

/** Six-digit code field. A right code opens the dispatch board (or redirectTo) with a full page load. */
export function MfaCodeForm({ factorId, submitLabel, autoFocus = true, redirectTo = MFA_DEFAULT_RETURN }: MfaCodeFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<MfaCodeInput, unknown, MfaCodeValues>({
    resolver: zodResolver(mfaCodeSchema),
    defaultValues: { code: '' },
  });

  const onSubmit = async ({ code }: MfaCodeValues) => {
    setFormError(null);
    const result = await verifyCode(factorId, code);
    if (!result.ok) {
      setFormError(result.error);
      resetField('code');
      setFocus('code');
      return;
    }
    setIsRedirecting(true);
    // A full page load, so the server sees the new aal2 session on every request.
    window.location.assign(redirectTo);
  };

  return (
    <>
      {isRedirecting && redirectTo === MFA_DEFAULT_RETURN && (
        <LoadingOverlay
          message="Opening Your Dispatch Board"
          description="Loading today's pours, pumps and crews."
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <AuthFormAlert message={formError} />

        <FormField id="code" label="6-Digit Code" error={errors.code?.message}>
          <Input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            placeholder="123456"
            autoFocus={autoFocus}
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? 'code-message' : undefined}
            className={cn(AUTH_INPUT_CLASS, 'font-mono tracking-[0.4em]')}
            {...register('code')}
          />
        </FormField>

        <AuthSubmitButton
          isLoading={isSubmitting || isRedirecting}
          label={submitLabel}
          loadingLabel="Checking Code..."
        />
      </form>
    </>
  );
}
