'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { LoadingOverlay } from '@/components/ui/loader';
import { AuthTicket } from '@/components/auth/auth-ticket';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthFormAlert } from '@/components/auth/auth-form-alert';
import { AuthSubmitButton } from '@/components/auth/auth-submit-button';
import { AUTH_INPUT_CLASS } from '@/components/auth/auth-styles';
import { loginSchema, type LoginValues } from '@/lib/auth/schemas';
import { loadWorkspace, signIn } from '@/lib/auth/auth-service';

export function LoginForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    const result = await signIn(values);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setIsRedirecting(true);
    router.prefetch('/schedule');
    const workspace = await loadWorkspace();
    if (!workspace.ok) {
      setIsRedirecting(false);
      setFormError(workspace.error);
      return;
    }
    router.push('/schedule');
  };

  return (
    <>
      {isRedirecting && (
        <LoadingOverlay
          message="Opening Your Dispatch Board"
          description="Loading today's pours, pumps and crews."
        />
      )}

      <AuthTicket stub="Invite only. Ask your admin for access.">
        <div className="flex flex-col gap-7">
          <AuthHeader title="Sign In" />

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

            <FormField
              id="password"
              label="Password"
              error={errors.password?.message}
              labelAction={
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground"
                >
                  Forgot Password?
                </Link>
              }
            >
              <PasswordInput
                id="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-message' : undefined}
                className={AUTH_INPUT_CLASS}
                {...register('password')}
              />
            </FormField>

            <Controller
              control={control}
              name="rememberMe"
              render={({ field }) => (
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id="rememberMe"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="focus-visible:ring-0"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="cursor-pointer select-none text-sm text-muted-foreground"
                  >
                    Keep Me Signed In On This Device
                  </label>
                </div>
              )}
            />

            <AuthSubmitButton
              isLoading={isSubmitting || isRedirecting}
              label="Sign In"
              loadingLabel="Signing In..."
            />
          </form>
        </div>
      </AuthTicket>
    </>
  );
}
