import { z } from 'zod';

const name = z.string().trim().min(1, 'Yard name is required').max(120, 'Keep this under 120 characters');
const address = z
  .string()
  .trim()
  .min(5, 'Enter the full address')
  .max(200, 'Keep this under 200 characters');

export const createYardSchema = z.object({ name, address });

export const updateYardSchema = z.object({
  id: z.string().uuid(),
  name,
  address,
  isActive: z.boolean(),
});

/** No input: the options are the company's own yards. */
export const yardOptionsSchema = z.object({});

export type YardFormValues = z.input<typeof createYardSchema>;
