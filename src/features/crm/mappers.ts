import { formatInTimeZone } from 'date-fns-tz';

import type { Tables } from '@/types/database.types';
import { formatE164 } from '@/lib/phone';
import type {
  ContactItem,
  ContactPerson,
  CustomerDetail,
  CustomerItem,
  JobSiteItem,
  LinkedCustomerAccount,
} from '@/features/crm/types';

export const CUSTOMER_COLUMNS =
  'id, customer_number, business_name, status, tier, phone, email, billing_address_line_1, billing_city, billing_state, billing_postal_code, dispatch_note, version, created_at';
export const CONTACT_COLUMNS =
  'id, first_name, last_name, job_title, email, phone, phone_type, is_active, created_at';
export const LINK_COLUMNS =
  'id, customer_id, contact_id, roles, is_primary, receives_job_confirmations, receives_invoices';
export const JOB_SITE_COLUMNS =
  'id, customer_id, name, address_line_1, address_line_2, city, state, postal_code, timezone';

export type CustomerRow = Pick<
  Tables<'customers'>,
  | 'id'
  | 'customer_number'
  | 'business_name'
  | 'status'
  | 'tier'
  | 'phone'
  | 'email'
  | 'billing_address_line_1'
  | 'billing_city'
  | 'billing_state'
  | 'billing_postal_code'
  | 'dispatch_note'
  | 'version'
  | 'created_at'
>;
export type ContactRow = Pick<
  Tables<'contacts'>,
  'id' | 'first_name' | 'last_name' | 'job_title' | 'email' | 'phone' | 'phone_type' | 'is_active' | 'created_at'
>;
export type LinkRow = Pick<
  Tables<'customer_contact_links'>,
  'id' | 'customer_id' | 'contact_id' | 'roles' | 'is_primary' | 'receives_job_confirmations' | 'receives_invoices'
>;
export type JobSiteRow = Pick<
  Tables<'job_sites'>,
  'id' | 'customer_id' | 'name' | 'address_line_1' | 'address_line_2' | 'city' | 'state' | 'postal_code' | 'timezone'
>;

export function fullName(contact: Pick<ContactRow, 'first_name' | 'last_name'>): string {
  return [contact.first_name, contact.last_name].filter(Boolean).join(' ');
}

/** "Primary + Site", "Invoicing", ... shown in the contacts directory. */
export function roleDisplay(roles: string[]): string {
  const primary = roles.includes('Primary contact');
  const site = roles.includes('Site contact');
  if (primary && site) return 'Primary + Site';
  if (primary) return 'Primary';
  if (roles.includes('Invoicing')) return 'Invoicing';
  if (site) return 'Site';
  return roles[0] ?? 'Contact';
}

export function formatAddress(parts: {
  line1?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
}): string {
  const cityState = [parts.city, [parts.state, parts.postalCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  return [parts.line1, cityState].filter(Boolean).join(', ');
}

function customerStatus(status: CustomerRow['status']): 'Active' | 'Inactive' {
  return status === 'active' || status === 'lead' ? 'Active' : 'Inactive';
}

export function mapCustomerListItem(
  row: CustomerRow,
  links: LinkRow[],
  contactsById: Map<string, ContactRow>,
  activeSites: number,
  timezone: string,
): CustomerItem {
  const link = links.find((l) => l.is_primary) ?? links[0];
  const contact = link ? contactsById.get(link.contact_id) : undefined;

  return {
    id: row.id,
    number: row.customer_number,
    name: row.business_name,
    contactName: contact ? fullName(contact) : 'No contact yet',
    contactRole: contact?.job_title ?? '',
    phone: formatE164(row.phone),
    email: row.email ?? '',
    tier: row.tier ?? '',
    activeSites,
    createdDate: formatInTimeZone(row.created_at, timezone, 'MMM d, yyyy'),
    createdTime: formatInTimeZone(row.created_at, timezone, 'h:mm a'),
    createdAtRaw: row.created_at,
    status: customerStatus(row.status),
    dispatchNote: row.dispatch_note ?? undefined,
  };
}

export function mapJobSite(row: JobSiteRow): JobSiteItem {
  return {
    id: row.id,
    name: row.name ?? row.address_line_1,
    address: formatAddress({
      line1: row.address_line_1,
      city: row.city,
      state: row.state,
      postalCode: row.postal_code,
    }),
    addressLine1: row.address_line_1,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code ?? '',
  };
}

export function mapContactPerson(link: LinkRow, contact: ContactRow): ContactPerson {
  return {
    id: contact.id,
    linkId: link.id,
    name: fullName(contact),
    title: contact.job_title ?? '',
    roles: link.roles,
    phone: formatE164(contact.phone),
    email: contact.email ?? '',
    isPrimary: link.is_primary,
    receivesInvoices: link.receives_invoices,
  };
}

export function mapCustomerDetail(
  row: CustomerRow,
  links: LinkRow[],
  contactsById: Map<string, ContactRow>,
  sites: JobSiteRow[],
  timezone: string,
): CustomerDetail {
  const contacts = links
    .map((link) => {
      const contact = contactsById.get(link.contact_id);
      return contact ? mapContactPerson(link, contact) : null;
    })
    .filter((c): c is ContactPerson => c !== null)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.name.localeCompare(b.name));

  const invoiceContact = contacts.find((c) => c.receivesInvoices);
  const defaultInvoiceRecipient = invoiceContact
    ? `${invoiceContact.name} · ${invoiceContact.email}`.replace(/ · $/, '')
    : row.email
      ? `Accounting · ${row.email}`
      : 'Not set';

  const cityState = [row.billing_city, row.billing_state].filter(Boolean).join(', ');
  const stateName = row.billing_state === 'ME' ? 'Maine' : row.billing_state;
  const location = [row.billing_city, stateName].filter(Boolean).join(', ');

  return {
    id: row.id,
    version: row.version,
    number: row.customer_number,
    name: row.business_name,
    tier: row.tier ?? '',
    phone: formatE164(row.phone),
    email: row.email ?? '',
    addressLine1: row.billing_address_line_1 ?? '',
    address:
      formatAddress({
        line1: row.billing_address_line_1,
        city: row.billing_city,
        state: row.billing_state,
        postalCode: row.billing_postal_code,
      }) || (cityState ? cityState : 'Not set'),
    customerSince: formatInTimeZone(row.created_at, timezone, 'MMMM d, yyyy'),
    location: location || 'Location not set',
    status: customerStatus(row.status),
    contacts,
    jobSites: sites.map(mapJobSite),
    defaultInvoiceRecipient,
  };
}

export function mapContactItem(
  contact: ContactRow,
  links: LinkRow[],
  customersById: Map<string, Pick<CustomerRow, 'id' | 'business_name'>>,
  timezone: string,
): ContactItem {
  const linkedAccounts: LinkedCustomerAccount[] = links
    .map((link) => {
      const customer = customersById.get(link.customer_id);
      return customer
        ? { linkId: link.id, customerId: customer.id, customerName: customer.business_name, roles: link.roles }
        : null;
    })
    .filter((a): a is LinkedCustomerAccount => a !== null);

  const first = linkedAccounts[0];

  return {
    id: contact.id,
    firstName: contact.first_name,
    lastName: contact.last_name ?? '',
    name: fullName(contact),
    title: contact.job_title ?? '',
    company: first?.customerName ?? 'No customer linked',
    customerId: first?.customerId ?? '',
    roles: first?.roles ?? [],
    roleDisplay: first ? roleDisplay(first.roles) : 'Contact',
    phone: formatE164(contact.phone),
    phoneType: contact.phone_type === 'Office' ? 'Office' : 'Mobile',
    email: contact.email ?? '',
    status: contact.is_active ? 'Active' : 'Inactive',
    createdAt: formatInTimeZone(contact.created_at, timezone, 'MMMM d, yyyy'),
    linkedAccounts,
  };
}
