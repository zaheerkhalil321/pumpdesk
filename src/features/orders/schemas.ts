import { z } from 'zod';

/** Shared by the order forms and the Server Actions. Times are what the forms show, e.g. "7:30 AM". */

const uuid = z.string().uuid();

const clock = z
  .string()
  .trim()
  .regex(/^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i, 'Use a time like 7:30 AM');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date');

/** Optional text: empty becomes null, so an update can clear it. */
function text(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => (value === '' ? null : value));
}

const minutes = (label: string) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be whole minutes`)
    .min(0, `${label} can't be negative`)
    .max(1440, `${label} can't be more than 24 hours`);

const orderFields = {
  customerId: uuid,
  jobSiteId: uuid.nullable().optional(),
  siteLabel: z.string().trim().min(2, 'Town or site address is required').max(200, 'Keep this under 200 characters'),
  jobName: text(120).optional(),
  pourType: text(60).optional(),
  supplierName: text(120).optional(),
  date: isoDate,
  pourTime: clock,
  arriveBy: clock,
  estimatedFinish: clock,
  prepMinutes: minutes('Prep time').optional(),
  pumpMinutes: minutes('Pumping time').optional(),
  cleanupMinutes: minutes('Cleanup time').optional(),
  travelMinutes: minutes('Travel time').optional(),
  estimatedYards: z
    .number({ error: 'Estimated volume is required' })
    .min(1, 'Volume must be between 1 and 10,000 yd³')
    .max(10000, 'Volume must be between 1 and 10,000 yd³'),
  minPumpSize: text(40).optional(),
  linesOnSite: z.boolean().optional(),
  purchaseOrder: text(80).optional(),
  collectOnDelivery: z.boolean().optional(),
  customerNotes: text(2000).optional(),
  siteInstructions: text(2000).optional(),
  internalNote: text(2000).optional(),
  billingService: text(120).optional(),
  maxPumpSize: text(40).optional(),
  extraItems: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Name the item').max(120, 'Keep this under 120 characters'),
        quantity: z
          .number({ error: 'Quantity must be a number' })
          .int('Quantity must be a whole number')
          .min(1, 'Quantity must be between 1 and 100')
          .max(100, 'Quantity must be between 1 and 100'),
      }),
    )
    .max(20, 'No more than 20 items')
    .optional(),
  bookingStatus: z.enum(['pending', 'inspection_pending', 'confirmed', 'turned_in', 'reviewed']).optional(),
  contactId: uuid.nullable().optional(),
  equipmentId: uuid.nullable().optional(),
  employeeId: uuid.nullable().optional(),
  secondEmployeeId: uuid.nullable().optional(),
};

export const bookOrderSchema = z.object(orderFields);

/**
 * Any field can be left out and stays as it was. A field sent as null or empty is cleared.
 * To move an order, send `date` and `pourTime` (plus `durationMinutes` to keep its length).
 */
export const updateOrderSchema = bookOrderSchema.partial().extend({
  id: uuid,
  version: z.number().int().positive(),
  durationMinutes: z.number().int().min(15).max(2880).optional(),
  dispatch: z.boolean().optional(),
});

export const cancelOrderSchema = z.object({
  id: uuid,
  version: z.number().int().positive(),
  reason: text(300).optional(),
});

export type BookOrderInput = z.input<typeof bookOrderSchema>;
export type UpdateOrderInput = z.input<typeof updateOrderSchema>;

/** A date range for the schedule calendar's day counts, at most about two months long. */
export const dayCountsSchema = z
  .object({ from: isoDate, to: isoDate })
  .refine((r) => r.from <= r.to, { message: 'The range ends before it starts' })
  .refine((r) => (Date.parse(r.to) - Date.parse(r.from)) / 86_400_000 <= 62, { message: 'Pick a shorter range' });

/** One day, for the order form's overlap check. */
export const dayBlocksSchema = z.object({ date: isoDate });

/** One operator, to list the jobs they are on. */
export const operatorJobsSchema = z.object({ id: uuid });
