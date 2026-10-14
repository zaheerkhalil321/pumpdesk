/**
 * Auth service boundary.
 *
 * The UI only talks to these functions. Today they are a demo placeholder: any
 * input that passes form validation succeeds after a realistic delay, so the
 * screens feel like production. When Supabase is wired up, only this file
 * changes (signInWithPassword, resetPasswordForEmail, updateUser).
 */

export type AuthResult = { ok: true } | { ok: false; error: string };

const LATENCY_MS = {
  signIn: 1400,
  resetRequest: 1200,
  updatePassword: 1200,
  loadWorkspace: 1100,
} as const;

function simulateNetwork(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function signIn(credentials: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<AuthResult> {
  await simulateNetwork(LATENCY_MS.signIn);
  void credentials;
  return { ok: true };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  await simulateNetwork(LATENCY_MS.resetRequest);
  // Always succeed so the UI never reveals whether an account exists.
  void email;
  return { ok: true };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  await simulateNetwork(LATENCY_MS.updatePassword);
  void newPassword;
  return { ok: true };
}

/** Loads the signed-in user's company and profile before entering the app. */
export async function loadWorkspace(): Promise<AuthResult> {
  await simulateNetwork(LATENCY_MS.loadWorkspace);
  return { ok: true };
}

export async function signOut(): Promise<AuthResult> {
  await simulateNetwork(300);
  return { ok: true };
}

