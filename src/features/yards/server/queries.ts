import 'server-only';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';
import type { YardItem, YardOption } from '@/features/yards/types';

/** Active yards first, then inactive ones. Read through the user client, so RLS applies. */
export async function listYards(): Promise<YardItem[]> {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('yards')
    .select('id, name, address, is_active')
    .order('is_active', { ascending: false })
    .order('name');
  if (error) throw error;
  return (data ?? []).map((y) => ({ id: y.id, name: y.name, address: y.address, isActive: y.is_active }));
}

/** The home yard of an operator, or null when they have none. */
export async function getOperatorYard(employeeId: string): Promise<{ name: string; address: string } | null> {
  await requireSession();
  const supabase = await createClient();
  const { data: employee, error } = await supabase
    .from('employees')
    .select('home_yard_id')
    .eq('id', employeeId)
    .maybeSingle();
  if (error) throw error;
  if (!employee?.home_yard_id) return null;
  const { data: yard, error: yardError } = await supabase
    .from('yards')
    .select('name, address')
    .eq('id', employee.home_yard_id)
    .eq('is_active', true)
    .maybeSingle();
  if (yardError) throw yardError;
  return yard ?? null;
}

/** The active yards, for an operator's "Home yard" dropdown. */
export async function listYardOptions(): Promise<YardOption[]> {
  return (await listYards()).filter((y) => y.isActive).map((y) => ({ value: y.id, label: y.name }));
}
