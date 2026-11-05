'use server';

import { revalidatePath } from 'next/cache';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';
import { createYardSchema, updateYardSchema, yardOptionsSchema } from '@/features/yards/schemas';
import { listYardOptions } from '@/features/yards/server/queries';

const YARD_EDITORS = ['owner', 'admin', 'dispatcher'] as const;

function revalidateYards() {
  revalidatePath('/settings');
  revalidatePath('/operators');
  revalidatePath('/pumps');
}

export const createYard = authedAction({
  schema: createYardSchema,
  roles: YARD_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('yards')
      .insert({ name: input.name, address: input.address })
      .select('id')
      .single();
    if (error) throw error;
    revalidateYards();
    return { id: data.id };
  },
});

/** Yards are never deleted: an inactive yard stays on the operators that used it. */
export const updateYard = authedAction({
  schema: updateYardSchema,
  roles: YARD_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('yards')
      .update({ name: input.name, address: input.address, is_active: input.isActive })
      .eq('id', input.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundError();
    revalidateYards();
    return { id: input.id };
  },
});

/** The active yards, for an operator's "Home yard" dropdown. Read only. */
export const getYardOptions = authedAction({
  schema: yardOptionsSchema,
  roles: ['owner', 'admin', 'dispatcher', 'office', 'operator', 'mechanic', 'accountant', 'read_only'],
  run: async () => listYardOptions(),
});
