import 'server-only';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';
import { formatE164 } from '@/lib/phone';
import type { CompanyProfile } from '@/features/company/types';
import { routableAddress } from '@/features/company/shop-address';

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

/**
 * The yard pumps leave from and return to: the HQ branch, else another branch, else the company address.
 * Only an address with a street or town counts, so a branch saved with just its state is skipped.
 */
export async function getShopAddress(): Promise<string | null> {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: branches, error: branchError } = await supabase
    .from('branches')
    .select('address_line_1, city, state, postal_code')
    .eq('is_active', true)
    .order('is_hq', { ascending: false });
  if (branchError) throw branchError;
  for (const branch of branches ?? []) {
    const address = routableAddress(branch);
    if (address) return address;
  }

  const { data: company, error } = await supabase
    .from('companies')
    .select('address_line_1, city, state, postal_code')
    .eq('id', session.companyId)
    .maybeSingle();
  if (error) throw error;
  return routableAddress(company);
}

/** The company profile shown in Settings > Company. Read through the user client, so RLS applies. */
export async function getCompanyProfile(): Promise<CompanyProfile> {
  const session = await requireSession();
  const supabase = await createClient();
  const [company, settings] = await Promise.all([
    supabase
      .from('companies')
      .select('display_name, legal_name, phone, email, website, address_line_1, address_line_2, city, state, postal_code, logo_text')
      .eq('id', session.companyId)
      .single(),
    supabase.from('company_settings').select('use_address_on_invoices').eq('company_id', session.companyId).maybeSingle(),
  ]);
  if (company.error) throw company.error;
  const c = company.data;
  return {
    companyName: c.display_name,
    legalBusinessName: c.legal_name,
    phone: formatE164(c.phone),
    email: c.email ?? '',
    website: c.website ?? '',
    logoText: c.logo_text ?? '',
    streetAddress: c.address_line_1 ?? '',
    suiteUnit: c.address_line_2 ?? '',
    city: c.city ?? '',
    state: c.state ?? '',
    zipCode: c.postal_code ?? '',
    useAddressOnInvoices: settings.data?.use_address_on_invoices ?? false,
  };
}
