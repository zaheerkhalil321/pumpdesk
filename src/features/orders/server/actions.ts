'use server';

import { revalidatePath } from 'next/cache';
import { formatInTimeZone } from 'date-fns-tz';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';
import { parseUsAddress } from '@/features/orders/address';
import { toInstant } from '@/features/orders/mappers';
import {
  bookOrderSchema,
  cancelOrderSchema,
  dayBlocksSchema,
  dayCountsSchema,
  operatorJobsSchema,
  updateOrderSchema,
} from '@/features/orders/schemas';
import { listDayBlocks, listDayCounts, listOperatorJobs } from '@/features/orders/server/queries';
import type { Database, Json } from '@/types/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

const ORDER_EDITORS = ['owner', 'admin', 'dispatcher', 'office'] as const;
const DAY_MS = 86_400_000;

type OrderResult = { id: string; job_number: string; version: number };

function revalidateOrders(jobNumber?: string) {
  revalidatePath('/orders');
  revalidatePath('/schedule');
  if (jobNumber) revalidatePath(`/orders/${jobNumber}`);
}

/** Makes typed text match literally in an ilike filter. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * A typed address becomes one of the customer's saved job sites once the order is confirmed,
 * so it is offered next time. Pending orders stay as typed. Saving the site is a convenience:
 * any problem here is ignored and the order itself is never affected.
 * Returns the order's new version when it linked a site, otherwise the version it was given.
 */
async function saveSiteWhenConfirmed(
  supabase: SupabaseClient<Database>,
  result: OrderResult,
  timezone: string,
): Promise<number> {
  try {
    const { data: job } = await supabase
      .from('jobs')
      .select('booking_status, job_site_id, site_label, customer_id, version')
      .eq('id', result.id)
      .maybeSingle();
    if (!job || job.booking_status !== 'confirmed' || job.job_site_id || !job.site_label) return result.version;

    const address = parseUsAddress(job.site_label);
    if (!address) return result.version;

    let existingQuery = supabase
      .from('job_sites')
      .select('id')
      .eq('customer_id', job.customer_id)
      .eq('is_active', true)
      .ilike('city', escapeLike(address.city));
    existingQuery = address.addressLine1
      ? existingQuery.ilike('address_line_1', escapeLike(address.addressLine1))
      : existingQuery.is('address_line_1', null);
    const { data: existing } = await existingQuery.limit(1);
    let siteId = existing?.[0]?.id;
    if (!siteId) {
      const { data: created, error } = await supabase
        .from('job_sites')
        .insert({
          customer_id: job.customer_id,
          address_line_1: address.addressLine1,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          timezone,
        })
        .select('id')
        .single();
      if (error) return result.version;
      siteId = created.id;
    }

    const { data: linked, error: linkError } = await supabase.rpc('update_job', {
      p: { id: result.id, version: job.version, job_site_id: siteId } as Json,
    });
    if (linkError) return result.version;
    revalidatePath('/customers');
    return (linked as OrderResult).version;
  } catch {
    return result.version;
  }
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
    result.version = await saveSiteWhenConfirmed(supabase, result, timezone);
    revalidateOrders(result.job_number);
    return result;
  },
});

export const updateOrder = authedAction({
  schema: updateOrderSchema,
  roles: ORDER_EDITORS,
  run: async ({ input, supabase, session }) => {
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
    result.version = await saveSiteWhenConfirmed(supabase, result, session.timezone);
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

/** Day counts for the schedule calendar when it is moved to another month. Read only. */
export const getDayCounts = authedAction({
  schema: dayCountsSchema,
  roles: ['owner', 'admin', 'dispatcher', 'office', 'operator', 'mechanic', 'accountant', 'read_only'],
  run: async ({ input }) => listDayCounts(input.from, input.to),
});

/** The pours already on pumps that day, so the order form can warn about an overlap. Read only. */
export const getDayBlocks = authedAction({
  schema: dayBlocksSchema,
  roles: ['owner', 'admin', 'dispatcher', 'office', 'operator', 'mechanic', 'accountant', 'read_only'],
  run: async ({ input }) => listDayBlocks(input.date),
});

/** The open jobs an operator is on, shown in the delete confirmation. Read only. */
export const getOperatorJobs = authedAction({
  schema: operatorJobsSchema,
  roles: ['owner', 'admin', 'dispatcher', 'office', 'operator', 'mechanic', 'accountant', 'read_only'],
  run: async ({ input }) => listOperatorJobs(input.id),
});
