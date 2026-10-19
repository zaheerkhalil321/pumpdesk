import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import type { Database } from '@/types/database.types';
import { createClient } from '@/server/supabase';

export type Session = {
  userId: string;
  companyId: string;
  companyName: string;
  timezone: string;
  role: Database['public']['Enums']['membership_role'];
};

/**
 * The signed-in user plus their company and role. The user id comes from the verified
 * token (getClaims); company and role are read live from company_memberships.
 * Returns null when logged out or when there is no active membership.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from('company_memberships')
    .select('role, company_id, companies(display_name, timezone)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.companies) return null;

  return {
    userId,
    companyId: data.company_id,
    companyName: data.companies.display_name,
    timezone: data.companies.timezone,
    role: data.role,
  };
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}
