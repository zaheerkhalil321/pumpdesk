import 'server-only';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';
import { formatE164 } from '@/lib/phone';
import { monogramOf } from '@/features/branches/code';
import type { BranchItem, Workspace } from '@/features/branches/types';

/** The main branch first, then active ones by name, then inactive ones. Read through the user client, so RLS applies. */
export async function listBranches(): Promise<BranchItem[]> {
  await requireSession();
  const supabase = await createClient();
  const [branches, pumps] = await Promise.all([
    supabase
      .from('branches')
      .select('id, name, code, address_line_1, city, state, postal_code, phone, is_hq, is_active')
      .order('is_hq', { ascending: false })
      .order('is_active', { ascending: false })
      .order('name'),
    supabase.from('equipment').select('branch_id').eq('is_active', true).not('branch_id', 'is', null),
  ]);
  if (branches.error) throw branches.error;
  if (pumps.error) throw pumps.error;

  const pumpCounts = new Map<string, number>();
  for (const pump of pumps.data ?? []) {
    if (pump.branch_id) pumpCounts.set(pump.branch_id, (pumpCounts.get(pump.branch_id) ?? 0) + 1);
  }
  return (branches.data ?? []).map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
    streetAddress: b.address_line_1 ?? '',
    city: b.city ?? '',
    state: b.state ?? '',
    zipCode: b.postal_code ?? '',
    phone: formatE164(b.phone),
    isHq: b.is_hq,
    isActive: b.is_active,
    pumpCount: pumpCounts.get(b.id) ?? 0,
  }));
}

/** The company name and its active branches, main branch first, for the sidebar. */
export async function getWorkspace(): Promise<Workspace> {
  const session = await requireSession();
  const supabase = await createClient();
  const [company, branches] = await Promise.all([
    supabase.from('companies').select('display_name').eq('id', session.companyId).maybeSingle(),
    supabase
      .from('branches')
      .select('id, name, code, city, state, is_hq')
      .eq('is_active', true)
      .order('is_hq', { ascending: false })
      .order('name'),
  ]);
  if (company.error) throw company.error;
  if (branches.error) throw branches.error;
  const companyName = company.data?.display_name ?? 'PumpDesk';
  return {
    companyName,
    monogram: monogramOf(companyName),
    branches: (branches.data ?? []).map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      place: [b.city, b.state].filter(Boolean).join(', '),
      isHq: b.is_hq,
    })),
  };
}
