/** View models the CRM screens render. Mappers turn database rows into these. */

export type CustomerItem = {
  id: string;
  number: string | null;
  name: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  activeSites: number;
  createdDate: string;
  createdTime: string;
  createdAtRaw: string;
  status: 'Active' | 'Inactive';
  tags?: string[];
  dispatchNote?: string;
};

export type ContactPerson = {
  id: string;
  linkId: string;
  name: string;
  title: string;
  roles: string[];
  phone: string;
  email: string;
  isPrimary: boolean;
  receivesInvoices: boolean;
};

export type JobSiteItem = {
  id: string;
  name: string;
  address: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
};

export type CustomerDetail = {
  id: string;
  version: number;
  number: string | null;
  name: string;
  phone: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  address: string;
  customerSince: string;
  location: string;
  status: 'Active' | 'Inactive';
  contacts: ContactPerson[];
  jobSites: JobSiteItem[];
  defaultInvoiceRecipient: string;
};

export type LinkedCustomerAccount = {
  linkId: string;
  customerId: string;
  customerName: string;
  roles: string[];
};

export type ContactItem = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  title: string;
  company: string;
  customerId: string;
  roles: string[];
  roleDisplay: string;
  phone: string;
  phoneType: 'Mobile' | 'Office';
  email: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  linkedAccounts: LinkedCustomerAccount[];
};

export type CustomerOption = { value: string; label: string };

export const CONTACT_ROLE_OPTIONS = [
  'Primary contact',
  'Site contact',
  'Invoicing',
  'Additional contact',
] as const;

/** Not saved in V1. Kept so the preferences modal still compiles. */
export type NotificationPreference = {
  id: string;
  title: string;
  description: string;
  channel: 'Email' | 'Text' | 'Off';
};
