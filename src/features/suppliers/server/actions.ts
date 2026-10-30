'use server';

import { revalidatePath } from 'next/cache';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';
import { createSupplierSchema, updateSupplierSchema } from '@/features/suppliers/schemas';

const SUPPLIER_EDITORS = ['owner', 'admin', 'dispatcher', 'office'] as const;

function revalidateSuppliers() {
  revalidatePath('/settings');
  revalidatePath('/schedule');
  revalidatePath('/orders');
}

export const createSupplier = authedAction({
  schema: createSupplierSchema,
  roles: SUPPLIER_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('concrete_suppliers')
      .insert({ name: input.name, phone: input.phone })
      .select('id')
      .single();
    if (error) throw error;
    revalidateSuppliers();
    return { id: data.id };
  },
});

export const updateSupplier = authedAction({
  schema: updateSupplierSchema,
  roles: SUPPLIER_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('concrete_suppliers')
      .update({ name: input.name, phone: input.phone, email: input.email, is_active: input.isActive })
      .eq('id', input.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundError();
    revalidateSuppliers();
    return { id: input.id };
  },
});
