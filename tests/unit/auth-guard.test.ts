import { describe, expect, it } from 'vitest';

import { guardRoute, hasFullSession, mfaReturnPath, mfaStep } from '@/lib/auth/guard';

const USER = '0b0f3f5e-2f1a-4a43-9a43-6f7f7e2b2a11';
const passwordOnly = { sub: USER, aal: 'aal1' };
const withCode = { sub: USER, aal: 'aal2' };

describe('guardRoute', () => {
  it('lets anyone reach the sign-in and password reset pages', () => {
    for (const path of ['/login', '/forgot-password', '/reset-password', '/auth/confirm']) {
      expect(guardRoute(path, null)).toBe('allow');
      expect(guardRoute(path, passwordOnly)).toBe('allow');
    }
  });

  it('sends signed-out visitors to sign-in, including the code screen', () => {
    expect(guardRoute('/schedule', null)).toBe('login');
    expect(guardRoute('/mfa', undefined)).toBe('login');
    expect(guardRoute('/schedule', { sub: '' })).toBe('login');
  });

  it('keeps a password-only session on the code screen', () => {
    expect(guardRoute('/schedule', passwordOnly)).toBe('mfa');
    expect(guardRoute('/settings', passwordOnly)).toBe('mfa');
    expect(guardRoute('/api/places/details', passwordOnly)).toBe('mfa');
    expect(guardRoute('/', passwordOnly)).toBe('mfa');
    expect(guardRoute('/mfa', passwordOnly)).toBe('allow');
  });

  it('treats a missing or odd aal claim as password-only', () => {
    expect(guardRoute('/schedule', { sub: USER })).toBe('mfa');
    expect(guardRoute('/schedule', { sub: USER, aal: 'AAL2' })).toBe('mfa');
  });

  it('does not match look-alike paths', () => {
    expect(guardRoute('/login-history', passwordOnly)).toBe('mfa');
    expect(guardRoute('/mfaish', passwordOnly)).toBe('mfa');
  });

  it('lets a session that passed the code step through', () => {
    expect(guardRoute('/schedule', withCode)).toBe('allow');
    expect(guardRoute('/mfa', withCode)).toBe('allow');
  });
});

describe('hasFullSession', () => {
  it('needs both a user and aal2', () => {
    expect(hasFullSession(withCode)).toBe(true);
    expect(hasFullSession(passwordOnly)).toBe(false);
    expect(hasFullSession({ aal: 'aal2' })).toBe(false);
    expect(hasFullSession(null)).toBe(false);
  });
});

describe('mfaStep', () => {
  it('asks for a code when the user has a verified app', () => {
    expect(mfaStep(passwordOnly, true)).toBe('verify');
  });

  it('sets up an app when the user has none yet', () => {
    expect(mfaStep(passwordOnly, false)).toBe('enroll');
  });

  it('is done once the session is aal2', () => {
    expect(mfaStep(withCode, true)).toBe('done');
  });
});

describe('mfaReturnPath', () => {
  it('only returns to known pages', () => {
    expect(mfaReturnPath('/reset-password')).toBe('/reset-password');
    expect(mfaReturnPath('//evil.example')).toBe('/schedule');
    expect(mfaReturnPath('https://evil.example')).toBe('/schedule');
    expect(mfaReturnPath('/settings')).toBe('/schedule');
    expect(mfaReturnPath(['/reset-password'])).toBe('/schedule');
    expect(mfaReturnPath(undefined)).toBe('/schedule');
  });
});
