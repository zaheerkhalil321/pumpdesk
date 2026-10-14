'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button, buttonVariants } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { AuthTicket } from '@/components/auth/auth-ticket';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthStamp } from '@/components/auth/auth-stamp';
import { AuthBackLink } from '@/components/auth/auth-back-link';
import { AuthFormAlert } from '@/components/auth/auth-form-alert';
import { AuthSubmitButton } from '@/components/auth/auth-submit-button';
import { AUTH_INPUT_CLASS } from '@/components/auth/auth-styles';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/auth/schemas';
import { requestPasswordReset } from '@/lib/auth/auth-service';
import { cn } from '@/lib/utils';

type ResendState = 'idle' | 'sending' | 'sent';

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendState, setResendState] = useState<ResendState>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    setFormError(null);
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setSentTo(email);
  };

  const handleResend = async () => {
    if (!sentTo) return;
    setResendState('sending');
    await requestPasswordReset(sentTo);
    setResendState('sent');
  };

  if (sentTo) {
    return (
      <AuthTicket stub="Not there? Check your spam folder.">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <AuthStamp>Link Sent</AuthStamp>
            <AuthHeader
              title="Check Your Email"
              description={
                <>
                  If <span className="font-medium text-foreground">{sentTo}</span> has an
                  account, a reset link is on its way. It works for 60 minutes.
                </>
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className={cn(buttonVariants({ size: 'lg' }), 'h-11 w-full font-semibold')}
            >
              Back To Sign In
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleResend}
              disabled={resendState !== 'idle'}
              className="h-11 w-full text-muted-foreground"
            >
              {resendState === 'idle' && 'Resend The Link'}
              {resendState === 'sending' && 'Sending...'}
              {resendState === 'sent' && 'Sent Again'}
            </Button>
          </div>
        </div>
      </AuthTicket>
    );
  }

  return (
    <AuthTicket stub={<AuthBackLink />}>
      <div className="flex flex-col gap-7">
        <AuthHeader
          title="Reset Your Password"
          description="Enter your email and we'll send you a link to choose a new one."
        />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <AuthFormAlert message={formError} />

          <FormField id="email" label="Email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              autoFocus
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-message' : undefined}
              className={AUTH_INPUT_CLASS}
              {...register('email')}
            />
          </FormField>

          <AuthSubmitButton
            isLoading={isSubmitting}
            label="Send Reset Link"
            loadingLabel="Sending Link..."
          />
        </form>
      </div>
    </AuthTicket>
  );
}
