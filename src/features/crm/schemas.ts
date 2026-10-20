import { z } from 'zod';

import { toE164 } from '@/lib/phone';

/** Shared by the forms and the Server Actions. Only editable fields are listed. */

const uuid = z.string().uuid();

const phone = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const e164 = toE164(value);
    if (!e164) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid US phone number' });
      return z.NEVER;
    }
    return e164;
  });

const email = z
  .string()
  .trim()
  .refine((value) => value === '' || z.email().safeParse(value).success, 'Enter a valid email address')
  .transform((value) => (value === '' ? null : value.toLowerCase()));

function text(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => (value === '' ? null : value));
}

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Keep this under ${max} characters`);

const timezone = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || Intl.supportedValuesOf('timeZone').includes(value),
    'Pick a valid time zone',
  )
  .transform((value) => (value === '' ? null : value));

const contactRoles = z.array(z.string().trim().min(1).max(40)).max(8);

export const customerStatusSchema = z.enum(['active', 'inactive']);

export const createCustomerSchema = z.object({
  businessName: requiredText('Company name'),
  contactName: text(120).optional(),
  phone: phone.optional(),
  email: email.optional(),
  tier: text(60).optional(),
  status: customerStatusSchema.default('active'),
});

export const updateCustomerSchema = z.object({
  id: uuid,
  version: z.number().int().positive(),
  businessName: requiredText('Company name'),
  phone: phone,
  email: email,
  addressLine1: text(160),
  status: customerStatusSchema,
});

export const archiveCustomerSchema = z.object({ id: uuid });

export const createContactSchema = z.object({
  firstName: requiredText('First name', 60),
  lastName: requiredText('Last name', 60),
  jobTitle: text(80).optional(),
  email: email.optional(),
  phone: phone.optional(),
  phoneType: z.enum(['Mobile', 'Office']).default('Mobile'),
  customerId: uuid.optional(),
  roles: contactRoles.default([]),
});

export const updateContactSchema = z.object({
  id: uuid,
  firstName: requiredText('First name', 60),
  lastName: requiredText('Last name', 60),
  jobTitle: text(80),
  email: email,
  phone: phone,
  phoneType: z.enum(['Mobile', 'Office']),
  isActive: z.boolean(),
});

export const archiveContactSchema = z.object({ id: uuid });

export const linkContactSchema = z.object({
  contactId: uuid,
  customerId: uuid,
  roles: contactRoles,
});

export const unlinkContactSchema = z.object({ linkId: uuid });

export const updateContactLinkSchema = z.object({
  linkId: uuid,
  roles: contactRoles.optional(),
  isPrimary: z.boolean().optional(),
  receivesJobConfirmations: z.boolean().optional(),
  receivesInvoices: z.boolean().optional(),
});

const jobSiteFields = {
  name: text(120),
  addressLine1: requiredText('Street address', 160),
  city: requiredText('City', 80),
  state: requiredText('State', 40),
  postalCode: text(12),
  timezone: timezone,
};

export const createJobSiteSchema = z.object({
  customerId: uuid,
  ...jobSiteFields,
});

export const updateJobSiteSchema = z.object({
  id: uuid,
  ...jobSiteFields,
});

export const archiveJobSiteSchema = z.object({ id: uuid });
