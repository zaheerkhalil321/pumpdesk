import { z } from 'zod';

import { toE164 } from '@/lib/phone';

const name = z.string().trim().min(1, 'Supplier name is required').max(120, 'Keep this under 120 characters');

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

export const createSupplierSchema = z.object({ name, phone });

export const updateSupplierSchema = z.object({
  id: z.string().uuid(),
  name,
  phone,
  email,
  isActive: z.boolean(),
});
