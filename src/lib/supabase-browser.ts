import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database.types';

/** Browser client. Used by auth-service.ts only (for now). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
