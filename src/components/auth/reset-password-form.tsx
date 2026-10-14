'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { buttonVariants } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { FormField } from '@/components/ui/form-field';
import { AuthTicket } from '@/components/auth/auth-ticket';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthStamp } from '@/components/auth/auth-stamp';
import { AuthFormAlert } from '@/components/auth/auth-form-alert';
import { AuthSubmitButton } from '@/components/auth/auth-submit-button';
import { PasswordRequirements } from '@/components/auth/password-requirements';
import { AUTH_INPUT_CLASS } from '@/components/auth/auth-styles';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/auth/schemas';
import { updatePassword } from '@/lib/auth/auth-service';
import { cn } from '@/lib/utils';

export function ResetPasswordForm() {
  const [isComplete, setIsComplete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = useWatch({ control, name: 'password' });

  const onSubmit = async ({ password: newPassword }: ResetPasswordValues) => {
    setFormError(null);
    const result = await updatePassword(newPassword);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <AuthTicket stub="You can close any other reset emails.">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-5">
            <AuthStamp tone="success">Updated</AuthStamp>
            <AuthHeader
              title="Password Changed"
              description="Sign in with your new password to get back to the board."
            />
          </div>
          <Link
            href="/login"
            className={cn(buttonVariants({ size: 'lg' }), 'h-11 w-full font-semibold')}
          >
            Continue To Sign In
          </Link>
        </div>
      </AuthTicket>
    );
  }

  return (
    <AuthTicket stub="Pick one you don't use anywhere else.">
      <div className="flex flex-col gap-7">
        <AuthHeader title="Choose A New Password" />

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
          <AuthFormAlert message={formError} />

          <FormField id="password" label="New Password" error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              autoFocus
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-message' : undefined}
              className={AUTH_INPUT_CLASS}
              {...register('password')}
            />
          </FormField>

          <PasswordRequirements value={password ?? ''} />

          <FormField
            id="confirmPassword"
            label="Confirm New Password"
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirmPassword-message' : undefined}
              className={AUTH_INPUT_CLASS}
              {...register('confirmPassword')}
            />
          </FormField>

          <AuthSubmitButton
            isLoading={isSubmitting}
            label="Update Password"
            loadingLabel="Updating..."
          />
        </form>
      </div>
    </AuthTicket>
  );
}
