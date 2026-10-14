import { describe, expect, it } from 'vitest';
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from '@/lib/auth/schemas';

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({
      email: ' jessie@midcoast.com ',
      password: 'anything',
      rememberMe: true,
    });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('jessie@midcoast.com');
  });

  it('rejects an invalid email and empty password', () => {
    const result = loginSchema.safeParse({ email: 'nope', password: '', rememberMe: false });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password']));
  });
});

describe('forgotPasswordSchema', () => {
  it('requires an email', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts a strong matching password', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'PumpDesk2026',
      confirmPassword: 'PumpDesk2026',
    });
    expect(result.success).toBe(true);
  });

  it.each(['short1A', 'alllowercase123', 'ALLUPPERCASE123', 'NoNumbersHere'])(
    'rejects weak password %s',
    (password) => {
      const result = resetPasswordSchema.safeParse({ password, confirmPassword: password });
      expect(result.success).toBe(false);
    }
  );

  it('flags mismatched confirmation on confirmPassword', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'PumpDesk2026',
      confirmPassword: 'PumpDesk2027',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['confirmPassword']);
  });
});
