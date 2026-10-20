import 'server-only';

import { z } from 'zod';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';
import {
  CONTACT_COLUMNS,
  CUSTOMER_COLUMNS,
  JOB_SITE_COLUMNS,
  LINK_COLUMNS,
  mapContactItem,
  mapCustomerDetail,
  mapCustomerListItem,
  mapJobSite,
  type ContactRow,
  type CustomerRow,
  type JobSiteRow,
  type LinkRow,
} from '@/features/crm/mappers';
import type {
  ContactItem,
  CustomerDetail,
  CustomerItem,
  CustomerOption,
  JobSiteItem,
} from '@/features/crm/types';

// All reads go through the user-scoped client, so RLS applies. Explicit column lists only.

const isUuid = (value: string) => z.string().uuid().safeParse(value).success;

function group<T>(rows: T[], key: (row: T) => string | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    if (!k) continue;
    map.set(k, [...(map.get(k) ?? []), row]);
  }
  return map;
}

export async function listCustomers(): Promise<CustomerItem[]> {
  const session = await requireSession();
  const supabase = await createClient();

  const [customers, links, contacts, sites] = await Promise.all([
    supabase.from('customers').select(CUSTOMER_COLUMNS).eq('is_active', true).order('business_name'),
    supabase.from('customer_contact_links').select(LINK_COLUMNS),
    supabase.from('contacts').select(CONTACT_COLUMNS),
    supabase.from('job_sites').select('customer_id').eq('is_active', true),
  ]);
  if (customers.error) throw customers.error;

  const linksByCustomer = group<LinkRow>(links.data ?? [], (l) => l.customer_id);
  const contactsById = new Map<string, ContactRow>((contacts.data ?? []).map((c) => [c.id, c]));
  const siteCounts = group(sites.data ?? [], (s) => s.customer_id);

  return (customers.data ?? []).map((row) =>
    mapCustomerListItem(
      row,
      linksByCustomer.get(row.id) ?? [],
      contactsById,
      siteCounts.get(row.id)?.length ?? 0,
      session.timezone,
    ),
  );
}

export async function listCustomerOptions(): Promise<CustomerOption[]> {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, business_name')
    .eq('is_active', true)
    .order('business_name');
  if (error) throw error;
  return (data ?? []).map((c) => ({ value: c.id, label: c.business_name }));
}

export async function getCustomer(id: string): Promise<CustomerDetail | null> {
  if (!isUuid(id)) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from('customers')
    .select(CUSTOMER_COLUMNS)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  if (!customer) return null;

  const [links, sites] = await Promise.all([
    supabase.from('customer_contact_links').select(LINK_COLUMNS).eq('customer_id', id),
    supabase.from('job_sites').select(JOB_SITE_COLUMNS).eq('customer_id', id).eq('is_active', true).order('name'),
  ]);

  const contactIds = (links.data ?? []).map((l) => l.contact_id);
  const contacts = contactIds.length
    ? await supabase.from('contacts').select(CONTACT_COLUMNS).in('id', contactIds).eq('is_active', true)
    : { data: [] as ContactRow[] };
  const contactsById = new Map<string, ContactRow>((contacts.data ?? []).map((c) => [c.id, c]));

  return mapCustomerDetail(
    customer as CustomerRow,
    links.data ?? [],
    contactsById,
    (sites.data ?? []) as JobSiteRow[],
    session.timezone,
  );
}

export async function listContacts(): Promise<ContactItem[]> {
  const session = await requireSession();
  const supabase = await createClient();

  const [contacts, links, customers] = await Promise.all([
    supabase.from('contacts').select(CONTACT_COLUMNS).order('first_name'),
    supabase.from('customer_contact_links').select(LINK_COLUMNS),
    supabase.from('customers').select('id, business_name').eq('is_active', true),
  ]);
  if (contacts.error) throw contacts.error;

  const linksByContact = group<LinkRow>(links.data ?? [], (l) => l.contact_id);
  const customersById = new Map((customers.data ?? []).map((c) => [c.id, c]));

  return (contacts.data ?? []).map((c) =>
    mapContactItem(c, linksByContact.get(c.id) ?? [], customersById, session.timezone),
  );
}

export async function getContact(id: string): Promise<ContactItem | null> {
  if (!isUuid(id)) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: contact, error } = await supabase
    .from('contacts')
    .select(CONTACT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!contact) return null;

  const [links, customers] = await Promise.all([
    supabase.from('customer_contact_links').select(LINK_COLUMNS).eq('contact_id', id),
    supabase.from('customers').select('id, business_name').eq('is_active', true),
  ]);
  const customersById = new Map((customers.data ?? []).map((c) => [c.id, c]));

  return mapContactItem(contact, links.data ?? [], customersById, session.timezone);
}

export async function listJobSites(customerId: string): Promise<JobSiteItem[]> {
  if (!isUuid(customerId)) return [];
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('job_sites')
    .select(JOB_SITE_COLUMNS)
    .eq('customer_id', customerId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []).map((row) => mapJobSite(row as JobSiteRow));
}
