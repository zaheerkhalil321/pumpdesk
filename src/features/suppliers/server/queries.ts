import 'server-only';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';
import { formatE164 } from '@/lib/phone';
import type { SupplierItem } from '@/features/suppliers/types';

/** Active suppliers first, then inactive ones. Read through the user client, so RLS applies. */
export async function listSuppliers(): Promise<SupplierItem[]> {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('concrete_suppliers')
    .select('id, name, phone, email, is_active')
    .order('is_active', { ascending: false })
    .order('name');
  if (error) throw error;
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    phone: formatE164(s.phone),
    email: s.email ?? '',
    isActive: s.is_active,
  }));
}
