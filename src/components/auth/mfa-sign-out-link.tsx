'use client';

import { useState } from 'react';

import { signOut } from '@/lib/auth/auth-service';

/** Small link on the code screens for leaving with the password-only session. */
export function MfaSignOutLink() {
  const [isLeaving, setIsLeaving] = useState(false);

  const handleSignOut = async () => {
    setIsLeaving(true);
    await signOut();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a full load clears this session's pages
    window.location.assign('/login');
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLeaving}
      className="font-medium text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-foreground disabled:opacity-60"
    >
      {isLeaving ? 'Signing Out...' : 'Sign Out'}
    </button>
  );
}
