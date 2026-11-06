import { z } from 'zod';

import { toE164 } from '@/lib/phone';

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Keep this under ${max} characters`);

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => (value === '' ? null : value));

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
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address')
  .transform((v) => (v === '' ? null : v.toLowerCase()));

/** The Midcoast profile in Settings > Company. Only editable fields are listed. */
export const updateCompanyProfileSchema = z.object({
  companyName: required('Company name', 120),
  legalBusinessName: required('Legal business name', 160),
  phone,
  email,
  website: optional(200),
  streetAddress: optional(200),
  suiteUnit: optional(60),
  city: optional(80),
  /** Two-letter state code, e.g. "ME". */
  state: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[A-Za-z]{2}$/.test(v), 'Choose a state')
    .transform((v) => (v === '' ? null : v.toUpperCase())),
  zipCode: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{5}(-\d{4})?$/.test(v), 'Enter a 5-digit ZIP code')
    .transform((v) => (v === '' ? null : v)),
  useAddressOnInvoices: z.boolean(),
});
