import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';

import type { Database } from '@/types/database.types';
import { actionError, mapError, type ActionErrorCode } from '@/server/errors';
import { getSession, type Session } from '@/server/session';
import { createClient } from '@/server/supabase';

type Role = Session['role'];

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: ActionErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

type ActionContext<S extends z.ZodObject> = {
  input: z.infer<S>;
  session: Session;
  supabase: SupabaseClient<Database>;
};

/**
 * Wraps a mutation: strict zod parse, then session, then role allow-list, then run,
 * then error mapping. Server Actions are public endpoints, so every step runs here
 * and the database (RLS) checks again.
 */
export function authedAction<S extends z.ZodObject, T>(config: {
  schema: S;
  roles: readonly Role[];
  run: (ctx: ActionContext<S>) => Promise<T>;
}) {
  return async (raw: unknown): Promise<ActionResult<T>> => {
    const parsed = config.schema.strict().safeParse(raw);
    if (!parsed.success) {
      return {
        ok: false,
        ...actionError('VALIDATION'),
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const session = await getSession();
    if (!session) return { ok: false, ...actionError('UNAUTHENTICATED') };
    if (!config.roles.includes(session.role)) return { ok: false, ...actionError('FORBIDDEN') };

    try {
      const supabase = await createClient();
      const data = await config.run({ input: parsed.data as z.infer<S>, session, supabase });
      return { ok: true, data };
    } catch (error) {
      return { ok: false, ...mapError(error) };
    }
  };
}
