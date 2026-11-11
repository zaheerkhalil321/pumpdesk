import { z } from 'zod';

import { toDialable } from '@/lib/phone';

export const CALL_PHONE_ERROR = 'Enter your phone number, for example (207) 555-0110 or +923001234567';

export const placeCallSchema = z.object({
  /** The order the call is placed from; empty from a customer, contact or operator page. */
  jobId: z.string().uuid().optional(),
  recipient: z.enum(['customer', 'contact', 'operator']),
  recipientId: z.string().uuid(),
  /** The dispatcher's own phone, rung first. */
  yourPhone: z
    .string()
    .trim()
    .refine((value) => toDialable(value) !== null, CALL_PHONE_ERROR),
});

/** No input: the phone is the signed-in user's own. */
export const callerPhoneSchema = z.object({});
