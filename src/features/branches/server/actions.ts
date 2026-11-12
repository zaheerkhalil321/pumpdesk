'use server';

import { revalidatePath } from 'next/cache';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';
import { BRANCH_EDITORS, createBranchSchema, updateBranchSchema } from '@/features/branches/schemas';
import { suggestBranchCode } from '@/features/branches/code';
import type { Database } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type Supabase = SupabaseClient<Database>;

function revalidateBranches() {
  // The sidebar on every page shows the branches, so the whole app layout is refreshed.
  revalidatePath('/', 'layout');
}

/** Clears the main-branch flag from every other branch, so only one branch is the main one. */
async function clearOtherHq(supabase: Supabase, keepId: string) {
  const { error } = await supabase.from('branches').update({ is_hq: false }).eq('is_hq', true).neq('id', keepId);
  if (error) throw error;
}

/** The given code, or one made from the name that no other branch uses. */
async function codeFor(supabase: Supabase, name: string, code: string | null, ignoreId?: string) {
  if (code) return code;
  let query = supabase.from('branches').select('code');
  if (ignoreId) query = query.neq('id', ignoreId);
  const { data, error } = await query;
  if (error) throw error;
  return suggestBranchCode(name, (data ?? []).map((b) => b.code));
}

export const createBranch = authedAction({
  schema: createBranchSchema,
  roles: BRANCH_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('branches')
      .insert({
        name: input.name,
        code: await codeFor(supabase, input.name, input.code),
        address_line_1: input.streetAddress,
        city: input.city,
        state: input.state,
        postal_code: input.zipCode,
        phone: input.phone,
        is_hq: input.isHq,
      })
      .select('id')
      .single();
    if (error) throw error;
    if (input.isHq) await clearOtherHq(supabase, data.id);
    revalidateBranches();
    return { id: data.id };
  },
});

/** Branches are never deleted: pumps, operators and yards keep pointing at an inactive one. */
export const updateBranch = authedAction({
  schema: updateBranchSchema,
  roles: BRANCH_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('branches')
      .update({
        name: input.name,
        code: await codeFor(supabase, input.name, input.code, input.id),
        address_line_1: input.streetAddress,
        city: input.city,
        state: input.state,
        postal_code: input.zipCode,
        phone: input.phone,
        is_hq: input.isHq,
        is_active: input.isActive,
      })
      .eq('id', input.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundError();
    if (input.isHq) await clearOtherHq(supabase, input.id);
    revalidateBranches();
    return { id: input.id };
  },
});
