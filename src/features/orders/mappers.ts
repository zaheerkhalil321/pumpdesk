import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import type { ScheduleBooking } from '@/components/schedule/schedule-types';
import type { Tables } from '@/types/database.types';
import { toOrderStatus } from '@/features/orders/statuses';
import type { FullOrderData, OrderItem } from '@/features/orders/types';

export type JobRow = Tables<'jobs'>;

/** A job with the names its screens need, looked up from the other tables. */
export interface HydratedJob {
  job: JobRow;
  customerName: string;
  contact: { id: string; name: string; phone: string } | null;
  pump: { id: string; code: string; model: string } | null;
  operator: { id: string; name: string; phone: string } | null;
  secondOperator: { id: string; name: string } | null;
  /** The saved site's address, when the order points at one. */
  siteAddress: string;
}

// ── Time helpers: everything is shown and typed in the order's own timezone ──

/** "7:30 AM" -> hour and minute on a 24-hour clock. */
export function parseClock(value: string): { hour: number; minute: number } {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) throw new Error(`Bad time: ${value}`);
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return { hour, minute: Number(match[2]) };
}

/** A clock time moved by some minutes, wrapping past midnight. "7:00 AM" + 150 -> "9:30 AM". */
export function shiftClock(value: string, minutes: number): string {
  const { hour, minute } = parseClock(value);
  const total = (((hour * 60 + minute + minutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  return `${h24 % 12 === 0 ? 12 : h24 % 12}:${String(total % 60).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`;
}

/** Hours past midnight (7.5) -> "7:30 AM". */
export function clockFromHour(hours: number): string {
  return shiftClock('12:00 AM', Math.round(hours * 60));
}

/** Clock times every 15 minutes across the whole day, "12:00 AM" to "11:45 PM". */
export const QUARTER_HOUR_CLOCKS: string[] = Array.from({ length: 96 }, (_, i) => clockFromHour(i / 4));

/** The instant for a local date (yyyy-MM-dd) and clock time ("7:30 AM") in a timezone. */
export function toInstant(isoDate: string, clock: string, timezone: string): Date {
  const { hour, minute } = parseClock(clock);
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return fromZonedTime(`${isoDate}T${hh}:${mm}:00`, timezone);
}

const clockOf = (iso: string, timezone: string) => formatInTimeZone(iso, timezone, 'h:mm a');

/** Hours past local midnight, e.g. 7.5 for 7:30 AM. The schedule grid positions bookings with this. */
export function localHour(iso: string, timezone: string): number {
  const [h, m] = formatInTimeZone(iso, timezone, 'H:m').split(':').map(Number);
  return h + m / 60;
}

// ── Columns each query asks for ──

export const JOB_COLUMNS =
  'id, company_id, job_number, customer_id, job_site_id, site_label, job_name, pour_type, supplier_name, scheduled_start, scheduled_end, arrive_by, timezone, service_date, travel_minutes, prep_minutes, pump_minutes, cleanup_minutes, estimated_yards, min_pump_size, lines_on_site, purchase_order_number, collect_on_delivery, customer_notes, site_instructions, internal_note, billing_service, max_pump_size, extra_items, priority, booking_status, dispatch_status, field_status, confirmed_at, dispatched_at, cancelled_at, cancellation_reason, completed_at, version, created_by, updated_by, created_at, updated_at';

/** extra_items is a JSON list of {name, quantity}; anything else reads as no items. */
function parseExtraItems(value: unknown): { name: string; quantity: number }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const { name, quantity } = item as { name?: unknown; quantity?: unknown };
    return typeof name === 'string' && typeof quantity === 'number' ? [{ name, quantity }] : [];
  });
}

// ── Status ──

function orderStatus(job: JobRow): OrderItem['status'] {
  return toOrderStatus(job.booking_status);
}

// ── View models ──

export function toOrderItem(h: HydratedJob): OrderItem {
  const { job } = h;
  return {
    id: job.job_number,
    jobId: job.id,
    serviceDate: formatInTimeZone(job.scheduled_start, job.timezone, 'EEE, MMM d, yyyy'),
    dateTimestamp: new Date(job.scheduled_start).getTime(),
    pourTime: clockOf(job.scheduled_start, job.timezone),
    customer: h.customerName,
    jobSite: job.site_label,
    pump: h.pump?.code ?? 'Unassigned',
    pumpModel: h.pump?.model ?? 'Unassigned',
    operator: h.operator?.name ?? 'Operator needed',
    operatorPhone: h.operator?.phone ?? '',
    isUnassigned: !h.pump && job.booking_status !== 'cancelled',
    status: orderStatus(job),
    invoiceStatus: 'Not created',
    volumeYards: Number(job.estimated_yards),
  };
}

export function toFullOrder(h: HydratedJob): FullOrderData {
  const { job } = h;
  const tz = job.timezone;
  const address = h.siteAddress || job.site_label;
  const hours = (m: number) => Math.round((m / 60) * 100) / 100;

  return {
    id: job.job_number,
    jobId: job.id,
    version: job.version,
    customerId: job.customer_id,
    contactId: h.contact?.id ?? null,
    pumpId: h.pump?.id ?? null,
    operatorId: h.operator?.id ?? null,
    secondOperatorId: h.secondOperator?.id ?? null,
    secondOperatorName: h.secondOperator?.name ?? '',
    maxPumpSize: job.max_pump_size ?? '',
    supplierName: job.supplier_name ?? '',
    linesOnSite: job.lines_on_site,
    customerNotes: job.customer_notes ?? '',
    internalNote: job.internal_note ?? '',
    billingService: job.billing_service ?? '',
    extraItems: parseExtraItems(job.extra_items),
    dispatchStatus: job.dispatch_status,
    customer: h.customerName,
    customerPhone: h.contact?.phone ?? '',
    customerContact: h.contact?.name ?? '',
    jobName: job.job_name ?? '',
    status: orderStatus(job),
    pourType: job.pour_type ?? '',
    locationCity: job.site_label.split(',')[1]?.trim() || job.site_label,
    serviceDate: formatInTimeZone(job.scheduled_start, tz, 'EEE, MMM d, yyyy'),
    serviceDateIso: formatInTimeZone(job.scheduled_start, tz, 'yyyy-MM-dd'),
    arriveBy: job.arrive_by ? clockOf(job.arrive_by, tz) : clockOf(job.scheduled_start, tz),
    pourTime: clockOf(job.scheduled_start, tz),
    estimatedEnd: clockOf(job.scheduled_end, tz),
    volumeYards: Number(job.estimated_yards),
    jobSiteAddress: job.site_label,
    jobSiteCityZip: h.siteAddress && h.siteAddress !== job.site_label ? h.siteAddress : '',
    directionsUrl: `https://maps.google.com/?q=${encodeURIComponent(address)}`,
    pumpRequested: job.min_pump_size ?? '',
    purchaseOrder: job.purchase_order_number ?? '',
    siteInstructions: job.site_instructions ?? '',
    assignedPumpCode: h.pump?.code ?? 'Unassigned',
    assignedPumpType: h.pump?.model ?? '',
    assignedOperator: h.operator?.name ?? 'Operator needed',
    operatorPhone: h.operator?.phone ?? '',
    workTicketNumber: '',
    workTicketStatus: 'Not submitted',
    invoiceStatus: 'Not created',
    collectOnDelivery: job.collect_on_delivery,
    notifyOperator: true,
    adjustedYards: Number(job.estimated_yards),
    adjustedTravel: hours(job.travel_minutes),
    adjustedPrep: hours(job.prep_minutes),
    adjustedPour: hours(job.pump_minutes),
    adjustedCleanup: hours(job.cleanup_minutes),
  };
}

/** One pour on the schedule board. */
export function toBooking(h: HydratedJob): ScheduleBooking {
  const { job } = h;
  const tz = job.timezone;
  // The pour starts at scheduled_start and the order ends at scheduled_end, clean-up included.
  // The board block covers everything: prep before the pour through the end of clean-up.
  const pourHour = localHour(job.scheduled_start, tz);
  const pourSpanHours =
    (new Date(job.scheduled_end).getTime() - new Date(job.scheduled_start).getTime()) / 3_600_000;
  const prepHours = Math.min(pourHour, job.prep_minutes / 60);
  const startHour = pourHour - prepHours;
  const durationHours = prepHours + pourSpanHours;
  const pourHours = Math.max(0.25, pourSpanHours - job.cleanup_minutes / 60);

  return {
    id: job.id,
    jobId: job.id,
    version: job.version,
    orderNumber: job.job_number,
    pumpId: h.pump?.id ?? '',
    pumpCode: h.pump?.code,
    pumpModel: h.pump?.model,
    customerName: h.customerName,
    jobSiteName: job.site_label,
    address: h.siteAddress && h.siteAddress !== job.site_label ? h.siteAddress : undefined,
    serviceDate: formatInTimeZone(job.scheduled_start, tz, 'yyyy-MM-dd'),
    supplierName: job.supplier_name ?? undefined,
    minPumpSize: job.min_pump_size ?? undefined,
    arriveByLabel: job.arrive_by ? clockOf(job.arrive_by, tz) : undefined,
    pourTimeLabel: clockOf(job.scheduled_start, tz),
    contactId: h.contact?.id,
    contactName: h.contact?.name,
    contactPhone: h.contact?.phone,
    startHour,
    durationHours: Math.max(0.5, durationHours),
    pourHour,
    pourHours,
    travelMinutes: job.travel_minutes,
    volumeYards: Number(job.estimated_yards),
    status: 'travel',
    notes: job.site_instructions ?? undefined,
    pourType: job.pour_type ?? undefined,
    operator: h.operator?.name ?? null,
    dispatchStatus:
      job.dispatch_status === 'dispatched' || job.dispatch_status === 'acknowledged'
        ? 'dispatched'
        : h.operator
          ? 'draft'
          : 'unassigned',
    dispatchedAt: job.dispatched_at ? clockOf(job.dispatched_at, tz) : undefined,
  };
}
