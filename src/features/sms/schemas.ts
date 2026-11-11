import { z } from 'zod';

export const SMS_MAX_LENGTH = 1000;

export const sendTextSchema = z.object({
  /** The order the text is sent from; empty from a customer, contact or operator page. */
  jobId: z.string().uuid().optional(),
  recipient: z.enum(['customer', 'contact', 'operator']),
  recipientId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, 'Write a message first')
    .max(SMS_MAX_LENGTH, `Keep this under ${SMS_MAX_LENGTH} characters`),
});

export type SendTextInput = z.input<typeof sendTextSchema>;
