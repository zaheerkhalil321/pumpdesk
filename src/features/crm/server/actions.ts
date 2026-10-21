'use server';

import { revalidatePath } from 'next/cache';

import { authedAction } from '@/server/action';
import { NotFoundError, StaleVersionError } from '@/server/errors';
import {
  deleteJobSiteSchema,
  createContactSchema,
  createCustomerSchema,
  createJobSiteSchema,
  linkContactSchema,
  unlinkContactSchema,
  updateContactLinkSchema,
  updateContactSchema,
  updateCustomerSchema,
  updateJobSiteSchema,
} from '@/features/crm/schemas';

const CRM_EDITORS = ['owner', 'admin', 'dispatcher', 'office', 'accountant'] as const;

function revalidateCrm(customerId?: string, contactId?: string) {
  revalidatePath('/customers');
  revalidatePath('/contacts');
  if (customerId) revalidatePath(`/customers/${customerId}`);
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

/** Splits "Jane van Doe" into first and last name. A single word is the first name. */
function splitName(full: string): { first: string; last: string | null } {
  const [first = '', ...rest] = full.trim().split(/\s+/);
  return { first, last: rest.length ? rest.join(' ') : null };
}

// ── Customers ───────────────────────────────────────────────────

export const createCustomer = authedAction({
  schema: createCustomerSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        business_name: input.businessName,
        phone: input.phone ?? null,
        email: input.email ?? null,
        tier: input.tier ?? null,
        status: input.status,
      })
      .select('id')
      .single();
    if (error) throw error;

    // The lead contact is optional. If it fails the customer is still saved.
    let contactSaved = true;
    if (input.contactName) {
      const { first, last } = splitName(input.contactName);
      const contact = await supabase
        .from('contacts')
        .insert({ first_name: first, last_name: last })
        .select('id')
        .single();
      const link = contact.data
        ? await supabase.from('customer_contact_links').insert({
            customer_id: data.id,
            contact_id: contact.data.id,
            roles: ['Primary contact'],
            is_primary: true,
            receives_job_confirmations: true,
          })
        : null;
      contactSaved = !contact.error && !link?.error;
    }

    revalidateCrm(data.id);
    return { id: data.id, contactSaved };
  },
});

export const updateCustomer = authedAction({
  schema: updateCustomerSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('customers')
      .update({
        business_name: input.businessName,
        phone: input.phone,
        email: input.email,
        billing_address_line_1: input.addressLine1,
        status: input.status,
      })
      .eq('id', input.id)
      .eq('version', input.version)
      .select('id, version');
    if (error) throw error;
    if (!data || data.length === 0) throw new StaleVersionError();

    revalidateCrm(input.id);
    return { id: input.id, version: data[0].version };
  },
});

// ── Contacts ────────────────────────────────────────────────────

export const createContact = authedAction({
  schema: createContactSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        job_title: input.jobTitle ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        phone_type: input.phoneType,
      })
      .select('id')
      .single();
    if (error) throw error;

    if (input.customerId) {
      const roles = input.roles.length ? input.roles : ['Site contact'];
      const link = await supabase.from('customer_contact_links').insert({
        customer_id: input.customerId,
        contact_id: data.id,
        roles,
        is_primary: roles.includes('Primary contact'),
        receives_invoices: roles.includes('Invoicing'),
      });
      if (link.error) throw link.error;
    }

    revalidateCrm(input.customerId, data.id);
    return { id: data.id };
  },
});

export const updateContact = authedAction({
  schema: updateContactSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        job_title: input.jobTitle,
        email: input.email,
        phone: input.phone,
        phone_type: input.phoneType,
        is_active: input.isActive,
      })
      .eq('id', input.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundError();

    revalidateCrm(undefined, input.id);
    return { id: input.id };
  },
});

// ── Contact <-> customer links ──────────────────────────────────

export const linkContactToCustomer = authedAction({
  schema: linkContactSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const roles = input.roles.length ? input.roles : ['Site contact'];

    const existing = await supabase
      .from('customer_contact_links')
      .select('id')
      .eq('customer_id', input.customerId)
      .eq('contact_id', input.contactId)
      .maybeSingle();
    if (existing.error) throw existing.error;

    const result = existing.data
      ? await supabase
          .from('customer_contact_links')
          .update({ roles, is_primary: roles.includes('Primary contact') })
          .eq('id', existing.data.id)
      : await supabase.from('customer_contact_links').insert({
          customer_id: input.customerId,
          contact_id: input.contactId,
          roles,
          is_primary: roles.includes('Primary contact'),
          receives_invoices: roles.includes('Invoicing'),
        });
    if (result.error) throw result.error;

    revalidateCrm(input.customerId, input.contactId);
    return { customerId: input.customerId, contactId: input.contactId };
  },
});

export const unlinkContactFromCustomer = authedAction({
  schema: unlinkContactSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const { error } = await supabase.from('customer_contact_links').delete().eq('id', input.linkId);
    if (error) throw error;
    revalidateCrm();
    return { linkId: input.linkId };
  },
});

export const updateContactLink = authedAction({
  schema: updateContactLinkSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const changes = {
      ...(input.roles !== undefined && { roles: input.roles }),
      ...(input.isPrimary !== undefined && { is_primary: input.isPrimary }),
      ...(input.receivesJobConfirmations !== undefined && {
        receives_job_confirmations: input.receivesJobConfirmations,
      }),
      ...(input.receivesInvoices !== undefined && { receives_invoices: input.receivesInvoices }),
    };
    const { error } = await supabase.from('customer_contact_links').update(changes).eq('id', input.linkId);
    if (error) throw error;
    revalidateCrm();
    return { linkId: input.linkId };
  },
});

// ── Job sites ───────────────────────────────────────────────────

export const createJobSite = authedAction({
  schema: createJobSiteSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('job_sites')
      .insert({
        customer_id: input.customerId,
        name: input.name,
        address_line_1: input.addressLine1,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        timezone: input.timezone,
      })
      .select('id')
      .single();
    if (error) throw error;
    revalidateCrm(input.customerId);
    return { id: data.id };
  },
});

export const updateJobSite = authedAction({
  schema: updateJobSiteSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('job_sites')
      .update({
        name: input.name,
        address_line_1: input.addressLine1,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
        timezone: input.timezone,
      })
      .eq('id', input.id)
      .select('customer_id');
    if (error) throw error;
    revalidateCrm(data?.[0]?.customer_id ?? undefined);
    return { id: input.id };
  },
});

/** Soft delete: the site is hidden but its record is kept. */
export const deleteJobSite = authedAction({
  schema: deleteJobSiteSchema,
  roles: CRM_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('job_sites')
      .update({ is_active: false })
      .eq('id', input.id)
      .select('customer_id');
    if (error) throw error;
    revalidateCrm(data?.[0]?.customer_id ?? undefined);
    return { id: input.id };
  },
});
