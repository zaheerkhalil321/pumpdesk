import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database.types';
import { RateLimitedError } from '@/server/errors';

type Limit = { max: number; minutes: number };

/** Texts and calls cost money, so one person can only send so many in a short while. */
export const TEXT_LIMIT: Limit = { max: 30, minutes: 10 };
export const CALL_LIMIT: Limit = { max: 15, minutes: 10 };

/**
 * Throws RateLimitedError when this user already has `max` rows in the log in the last
 * `minutes`. The log tables record every text and call, sent or not, so they are the count.
 */
export async function assertUnderLimit(
  supabase: SupabaseClient<Database>,
  table: 'sms_messages' | 'call_logs',
  userId: string,
  limit: Limit,
): Promise<void> {
  const since = new Date(Date.now() - limit.minutes * 60_000).toISOString();
  const { count, error } =
    table === 'sms_messages'
      ? await supabase
          .from('sms_messages')
          .select('id', { count: 'exact', head: true })
          .eq('sent_by', userId)
          .gte('created_at', since)
      : await supabase
          .from('call_logs')
          .select('id', { count: 'exact', head: true })
          .eq('placed_by', userId)
          .gte('created_at', since);
  if (error) throw error;
  if ((count ?? 0) >= limit.max) throw new RateLimitedError();
}
