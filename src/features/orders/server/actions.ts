'use server';

import { revalidatePath } from 'next/cache';
import { formatInTimeZone } from 'date-fns-tz';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';
import { toInstant } from '@/features/orders/mappers';
import { bookOrderSchema, cancelOrderSchema, updateOrderSchema } from '@/features/orders/schemas';
import type { Json } from '@/types/database.types';

const ORDER_EDITORS = ['owner', 'admin', 'dispatcher', 'office'] as const;
const DAY_MS = 86_400_000;

type OrderResult = { id: string; job_number: string; version: number };

function revalidateOrders(jobNumber?: string) {
  revalidatePath('/orders');
  revalidatePath('/schedule');
  if (jobNumber) revalidatePath(`/orders/${jobNumber}`);
}

/** Form field -> database field, for the fields that need no conversion. */
const FIELD_COLUMNS = {
  customerId: 'customer_id',
  jobSiteId: 'job_site_id',
  siteLabel: 'site_label',
  jobName: 'job_name',
  pourType: 'pour_type',
  supplierName: 'supplier_name',
  prepMinutes: 'prep_minutes',
  pumpMinutes: 'pump_minutes',
  cleanupMinutes: 'cleanup_minutes',
  travelMinutes: 'travel_minutes',
  estimatedYards: 'estimated_yards',
  minPumpSize: 'min_pump_size',
  linesOnSite: 'lines_on_site',
  purchaseOrder: 'purchase_order_number',
  collectOnDelivery: 'collect_on_delivery',
  customerNotes: 'customer_notes',
  siteInstructions: 'site_instructions',
  internalNote: 'internal_note',
  billingService: 'billing_service',
  maxPumpSize: 'max_pump_size',
  extraItems: 'extra_items',
  bookingStatus: 'booking_status',
  contactId: 'contact_id',
  equipmentId: 'equipment_id',
  employeeId: 'employee_id',
  secondEmployeeId: 'second_employee_id',
  dispatch: 'dispatch',
} as const;

export const createOrder = authedAction({
  schema: bookOrderSchema,
  roles: ORDER_EDITORS,
  run: async ({ input, supabase, session }) => {
    const timezone = session.timezone;
    const start = toInstant(input.date, input.pourTime, timezone);
    let end = toInstant(input.date, input.estimatedFinish, timezone);
    if (end <= start) end = new Date(end.getTime() + DAY_MS); // finishes after midnight
    let arrive = toInstant(input.date, input.arriveBy, timezone);
    if (arrive > start) arrive = new Date(arrive.getTime() - DAY_MS);

    const payload: Record<string, unknown> = {
      timezone,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      arrive_by: arrive.toISOString(),
    };
    for (const [field, column] of Object.entries(FIELD_COLUMNS)) {
      if (field in input) payload[column] = input[field as keyof typeof input];
    }

    const { data, error } = await supabase.rpc('book_job', { p: payload as Json });
    if (error) throw error;
    const result = data as OrderResult;
    revalidateOrders(result.job_number);
    return result;
  },
});

export const updateOrder = authedAction({
  schema: updateOrderSchema,
  roles: ORDER_EDITORS,
  run: async ({ input, supabase }) => {
    const { id, version, date, pourTime, arriveBy, estimatedFinish, durationMinutes, ...fields } = input;
    const payload: Record<string, unknown> = { id, version };
    for (const [field, column] of Object.entries(FIELD_COLUMNS)) {
      const value = fields[field as keyof typeof fields];
      if (value !== undefined) payload[column] = value;
    }

    // Moving the pour: work out the new start, end and arrival in the order's own timezone.
    if (date || pourTime || arriveBy || estimatedFinish || durationMinutes !== undefined) {
      const { data: current, error: readError } = await supabase
        .from('jobs')
        .select('scheduled_start, scheduled_end, arrive_by, timezone')
        .eq('id', id)
        .maybeSingle();
      if (readError) throw readError;
      if (!current) throw new NotFoundError();

      const tz = current.timezone;
      const oldStart = new Date(current.scheduled_start);
      const oldEnd = new Date(current.scheduled_end);
      const day = date ?? formatInTimeZone(oldStart, tz, 'yyyy-MM-dd');
      const start = toInstant(day, pourTime ?? formatInTimeZone(oldStart, tz, 'h:mm a'), tz);

      let end: Date;
      if (estimatedFinish) {
        end = toInstant(day, estimatedFinish, tz);
        if (end <= start) end = new Date(end.getTime() + DAY_MS);
      } else {
        const length = durationMinutes !== undefined ? durationMinutes * 60_000 : oldEnd.getTime() - oldStart.getTime();
        end = new Date(start.getTime() + length);
      }

      payload.scheduled_start = start.toISOString();
      payload.scheduled_end = end.toISOString();
      if (arriveBy) {
        let arrive = toInstant(day, arriveBy, tz);
        if (arrive > start) arrive = new Date(arrive.getTime() - DAY_MS);
        payload.arrive_by = arrive.toISOString();
      } else if (current.arrive_by) {
        // Keep the same lead time before the pour.
        const lead = oldStart.getTime() - new Date(current.arrive_by).getTime();
        payload.arrive_by = new Date(start.getTime() - lead).toISOString();
      }
    }

    const { data, error } = await supabase.rpc('update_job', { p: payload as Json });
    if (error) throw error;
    const result = data as OrderResult;
    revalidateOrders(result.job_number);
    return result;
  },
});

export const cancelOrder = authedAction({
  schema: cancelOrderSchema,
  roles: ORDER_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase.rpc('cancel_job', {
      p_job: input.id,
      p_reason: input.reason ?? '',
      p_version: input.version,
    });
    if (error) throw error;
    const result = data as OrderResult;
    revalidateOrders(result.job_number);
    return result;
  },
});
