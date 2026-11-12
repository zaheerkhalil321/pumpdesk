import { z } from 'zod';

import { toE164 } from '@/lib/phone';

/** The database lets only owners and admins add or change branches. */
export const BRANCH_EDITORS = ['owner', 'admin'] as const;

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

const branchFields = {
  name: z.string().trim().min(1, 'Branch name is required').max(120, 'Keep this under 120 characters'),
  /** Short code shown on badges, e.g. "WAR". Left empty, one is made from the name. */
  code: z
    .string()
    .trim()
    .refine((v) => v === '' || /^[A-Za-z0-9]{1,6}$/.test(v), 'Use up to 6 letters or numbers')
    .transform((v) => (v === '' ? null : v.toUpperCase())),
  streetAddress: optional(200),
  city: z.string().trim().min(1, 'Town or city is required').max(80, 'Keep this under 80 characters'),
  /** Two-letter state code, e.g. "ME". */
  state: z
    .string()
    .trim()
    .refine((v) => /^[A-Za-z]{2}$/.test(v), 'Choose a state')
    .transform((v) => v.toUpperCase()),
  zipCode: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{5}(-\d{4})?$/.test(v), 'Enter a 5-digit ZIP code')
    .transform((v) => (v === '' ? null : v)),
  phone,
  /** The main branch. Drive time starts from its address when an operator has no home yard. */
  isHq: z.boolean(),
};

export const createBranchSchema = z.object(branchFields);

export const updateBranchSchema = z
  .object({ id: z.string().uuid(), ...branchFields, isActive: z.boolean() })
  .refine((b) => b.isActive || !b.isHq, { message: 'The main branch must stay active', path: ['isActive'] });

export type BranchFormValues = z.input<typeof createBranchSchema>;
export type BranchFormOutput = z.output<typeof createBranchSchema>;
