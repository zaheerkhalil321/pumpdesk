import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';

/**
 * Service-role Supabase client. It skips row security, so it is used ONLY by the notification sender,
 * never for anything a user asks for directly. Returns null when the secret key is not set.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
