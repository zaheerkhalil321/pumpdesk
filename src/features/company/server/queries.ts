import 'server-only';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';

/** The public link to the company logo, or null when none is uploaded. */
export async function getCompanyLogoUrl(): Promise<string | null> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('companies')
    .select('logo_path')
    .eq('id', session.companyId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.logo_path) return null;
  return supabase.storage.from('company-logos').getPublicUrl(data.logo_path).data.publicUrl;
}
