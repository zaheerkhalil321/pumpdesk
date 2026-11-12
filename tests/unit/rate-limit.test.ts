import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import type { Database } from '@/types/database.types';

vi.mock('server-only', () => ({}));

const { assertUnderLimit } = await import('@/server/rate-limit');
const { RateLimitedError, mapError } = await import('@/server/errors');

/** A fake client that answers the count query with `count` and records the filters. */
function fakeClient(count: number) {
  const calls: { table?: string; eq?: [string, string]; gte?: [string, string] } = {};
  const query = {
    select: () => query,
    eq: (column: string, value: string) => {
      calls.eq = [column, value];
      return query;
    },
    gte: (column: string, value: string) => {
      calls.gte = [column, value];
      return Promise.resolve({ count, error: null });
    },
  };
  const client = {
    from: (table: string) => {
      calls.table = table;
      return query;
    },
  } as unknown as SupabaseClient<Database>;
  return { client, calls };
}

describe('assertUnderLimit', () => {
  const limit = { max: 3, minutes: 10 };

  it('lets the action through while under the limit', async () => {
    const { client, calls } = fakeClient(2);
    await expect(assertUnderLimit(client, 'sms_messages', 'user-1', limit)).resolves.toBeUndefined();
    expect(calls.table).toBe('sms_messages');
    expect(calls.eq).toEqual(['sent_by', 'user-1']);
  });

  it('counts calls by who placed them', async () => {
    const { client, calls } = fakeClient(0);
    await assertUnderLimit(client, 'call_logs', 'user-2', limit);
    expect(calls.eq).toEqual(['placed_by', 'user-2']);
  });

  it('only counts the last few minutes', async () => {
    const { client, calls } = fakeClient(0);
    const before = Date.now();
    await assertUnderLimit(client, 'sms_messages', 'user-1', limit);
    const since = Date.parse(calls.gte?.[1] ?? '');
    expect(calls.gte?.[0]).toBe('created_at');
    expect(before - since).toBeGreaterThanOrEqual(10 * 60_000);
    expect(before - since).toBeLessThan(10 * 60_000 + 1_000);
  });

  it('stops the action at the limit with a plain message', async () => {
    const { client } = fakeClient(3);
    const attempt = assertUnderLimit(client, 'sms_messages', 'user-1', limit);
    await expect(attempt).rejects.toBeInstanceOf(RateLimitedError);
    expect(mapError(new RateLimitedError())).toEqual({
      code: 'RATE_LIMITED',
      message: 'Too many in a short time. Please wait a few minutes and try again.',
    });
  });
});
