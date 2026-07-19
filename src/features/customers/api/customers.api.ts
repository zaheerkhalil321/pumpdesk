import { supabase } from "@/lib/supabase";

import type { Customer } from "../types";

export async function getCustomers(options?: {
  active?: boolean;
}) {
  let query = supabase
    .from("customers")
    .select("*")
    .order("name");

  if (options?.active !== undefined) {
    query = query.eq("active", options.active);
  }

  const result = await query;

  return {
    ...result,
    data: (result.data ?? []) as Customer[],
  };
}

export async function getCustomer(id: string) {
  const result = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  return {
    ...result,
    data: result.data as Customer | null,
  };
}

export async function createCustomer(name: string) {
  const result = await supabase
    .from("customers")
    .insert({
      name: name.trim(),
    })
    .select()
    .single();

  return {
    ...result,
    data: result.data as Customer | null,
  };
}

export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
) {
  const result = await supabase
    .from("customers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return {
    ...result,
    data: result.data as Customer | null,
  };
}

export async function archiveCustomer(id: string) {
  return supabase
    .from("customers")
    .update({
      active: false,
    })
    .eq("id", id)
    .select()
    .single();
}

export async function restoreCustomer(id: string) {
  return supabase
    .from("customers")
    .update({
      active: true,
    })
    .eq("id", id)
    .select()
    .single();
}