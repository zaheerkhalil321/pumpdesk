import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 10;

export interface PasswordRequirement {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'case',
    label: 'Upper and lowercase letters',
    test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value),
  },
  {
    id: 'number',
    label: 'At least one number',
    test: (value) => /\d/.test(value),
  },
];

const emailField = z
  .string()
  .trim()
  .min(1, 'Enter your email address')
  .email('Enter a valid email address');

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Enter your password'),
  rememberMe: z.boolean(),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .refine(
        (value) => PASSWORD_REQUIREMENTS.every((req) => req.test(value)),
        'Password does not meet all requirements'
      ),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
