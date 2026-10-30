import 'server-only';

import { format, parseISO } from 'date-fns';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';
import { formatAddress } from '@/features/crm/mappers';
import { getPumpDisplayName } from '@/features/fleet/format';
import { todayIn } from '@/features/fleet/mappers';
import { listOperators, listPumps } from '@/features/fleet/server/queries';
import { listSuppliers } from '@/features/suppliers/server/queries';
import type { OrderFormSupplier } from '@/features/suppliers/types';
import { formatE164 } from '@/lib/phone';
import {
  JOB_COLUMNS,
  toBooking,
  toFullOrder,
  toOrderItem,
  type HydratedJob,
  type JobRow,
} from '@/features/orders/mappers';
import type { ScheduleBooking } from '@/components/schedule/schedule-types';
import type {
  DayBlock,
  DayCounts,
  OperatorJob,
  FullOrderData,
  NavCounts,
  OrderFormCustomer,
  OrderFormOperator,
  OrderFormOptions,
  OrderFormPump,
  OrderItem,
} from '@/features/orders/types';

// All reads go through the user-scoped client, so RLS applies.

async function loadCustomers(): Promise<OrderFormCustomer[]> {
  const supabase = await createClient();
  const [customers, links, contacts, sites] = await Promise.all([
    supabase
      .from('customers')
      .select('id, business_name')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('business_name'),
    supabase.from('customer_contact_links').select('customer_id, contact_id, is_primary'),
    supabase
      .from('contacts')
      .select('id, first_name, last_name, job_title, phone')
      .eq('is_active', true),
    supabase
      .from('job_sites')
      .select('id, customer_id, name, address_line_1, city, state, postal_code')
      .eq('is_active', true)
      .order('name'),
  ]);
  for (const result of [customers, links, contacts, sites]) {
    if (result.error) throw result.error;
  }

  const contactsById = new Map((contacts.data ?? []).map((c) => [c.id, c]));

  return (customers.data ?? []).map((customer) => {
    const customerLinks = (links.data ?? [])
      .filter((l) => l.customer_id === customer.id)
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary));

    return {
      id: customer.id,
      name: customer.business_name,
      contacts: customerLinks.flatMap((link) => {
        const contact = contactsById.get(link.contact_id);
        if (!contact) return [];
        return [
          {
            id: contact.id,
            name: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
            role: contact.job_title ?? '',
            phone: formatE164(contact.phone),
          },
        ];
      }),
      sites: (sites.data ?? [])
        .filter((s) => s.customer_id === customer.id)
        .map((s) => {
          const address = formatAddress({
            line1: s.address_line_1,
            city: s.city,
            state: s.state,
            postalCode: s.postal_code,
          });
          return { id: s.id, label: s.name ? `${s.name} · ${address}` : address, address };
        }),
    };
  });
}

/** Everything the order forms need to offer real customers, contacts, sites, pumps and operators. */
export async function getOrderFormOptions(): Promise<OrderFormOptions> {
  await requireSession();
  const [customers, allPumps, allOperators, allSuppliers] = await Promise.all([
    loadCustomers(),
    listPumps(),
    listOperators(),
    listSuppliers(),
  ]);

  const pumps: OrderFormPump[] = allPumps
    .filter((p) => p.status === 'available')
    .map((p) => {
      const code = getPumpDisplayName(p);
      return {
        id: p.id,
        code,
        label: `${code} ${p.make}`.trim(),
        sizeLabel: p.type === 'line_pump' ? 'Line pump' : `${p.boomSize ?? ''} m`.trim(),
        model: `${p.make} ${p.model}`.trim(),
        boomLength: p.boomLength,
        hourlyRate: p.hourlyRate === '' ? '' : `$${Number(p.hourlyRate)} / hr`,
        defaultOperatorId: p.defaultOperator.id || null,
        defaultOperatorName: p.defaultOperator.name || '',
      };
    });

  const operators: OrderFormOperator[] = allOperators
    .filter((o) => o.status === 'Active')
    .map((o) => ({ id: o.id, name: o.name, phone: o.phone }));

  const suppliers: OrderFormSupplier[] = allSuppliers
    .filter((s) => s.isActive)
    .map((s) => ({ id: s.id, name: s.name, phone: s.phone }));

  return { customers, pumps, operators, suppliers };
}

// ── Orders ───────────────────────────────────────────────────────

const unique = <T,>(values: T[]) => [...new Set(values)];

/** Adds customer, contact, pump and operator names to a list of jobs. */
async function hydrate(jobs: JobRow[]): Promise<HydratedJob[]> {
  if (jobs.length === 0) return [];
  const supabase = await createClient();
  const jobIds = jobs.map((j) => j.id);
  const siteIds = unique(jobs.map((j) => j.job_site_id).filter((id): id is string => Boolean(id)));

  const [customers, contactLinks, equipment, employees, sites, pumps, operators] = await Promise.all([
    supabase.from('customers').select('id, business_name').in('id', unique(jobs.map((j) => j.customer_id))),
    supabase.from('job_contacts').select('job_id, contact_id').in('job_id', jobIds),
    supabase
      .from('job_equipment_assignments')
      .select('job_id, equipment_id')
      .in('job_id', jobIds)
      .is('released_at', null),
    supabase
      .from('job_employee_assignments')
      .select('job_id, employee_id, assignment_type')
      .in('job_id', jobIds)
      .in('assignment_type', ['primary_operator', 'second_operator'])
      .is('released_at', null),
    siteIds.length
      ? supabase
          .from('job_sites')
          .select('id, address_line_1, city, state, postal_code')
          .in('id', siteIds)
      : Promise.resolve({ data: [], error: null }),
    listPumps(),
    listOperators(),
  ]);
  for (const result of [customers, contactLinks, equipment, employees, sites]) {
    if (result.error) throw result.error;
  }

  const contactIds = unique((contactLinks.data ?? []).map((l) => l.contact_id));
  const contacts = contactIds.length
    ? await supabase.from('contacts').select('id, first_name, last_name, phone').in('id', contactIds)
    : { data: [], error: null };
  if (contacts.error) throw contacts.error;

  const customerById = new Map((customers.data ?? []).map((c) => [c.id, c.business_name]));
  const contactById = new Map((contacts.data ?? []).map((c) => [c.id, c]));
  const contactByJob = new Map((contactLinks.data ?? []).map((l) => [l.job_id, l.contact_id]));
  const pumpByJob = new Map((equipment.data ?? []).map((a) => [a.job_id, a.equipment_id]));
  const operatorByJob = new Map(
    (employees.data ?? []).filter((a) => a.assignment_type === 'primary_operator').map((a) => [a.job_id, a.employee_id]),
  );
  const secondByJob = new Map(
    (employees.data ?? []).filter((a) => a.assignment_type === 'second_operator').map((a) => [a.job_id, a.employee_id]),
  );
  const siteById = new Map((sites.data ?? []).map((s) => [s.id, s]));
  const pumpById = new Map(pumps.map((p) => [p.id, p]));
  const operatorById = new Map(operators.map((o) => [o.id, o]));

  return jobs.map((job) => {
    const contact = contactById.get(contactByJob.get(job.id) ?? '');
    const pump = pumpById.get(pumpByJob.get(job.id) ?? '');
    const operator = operatorById.get(operatorByJob.get(job.id) ?? '');
    const second = operatorById.get(secondByJob.get(job.id) ?? '');
    const site = job.job_site_id ? siteById.get(job.job_site_id) : undefined;
    return {
      job,
      customerName: customerById.get(job.customer_id) ?? 'Customer',
      contact: contact
        ? {
            id: contact.id,
            name: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
            phone: formatE164(contact.phone),
          }
        : null,
      pump: pump
        ? { id: pump.id, code: getPumpDisplayName(pump), model: `${pump.make} ${pump.model}`.trim() }
        : null,
      operator: operator ? { id: operator.id, name: operator.name, phone: operator.phone } : null,
      secondOperator: second ? { id: second.id, name: second.name } : null,
      siteAddress: site
        ? formatAddress({
            line1: site.address_line_1,
            city: site.city,
            state: site.state,
            postalCode: site.postal_code,
          })
        : '',
    };
  });
}

/** All orders, newest first, for the Orders list. */
export async function listOrders(): Promise<OrderItem[]> {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_COLUMNS)
    .order('scheduled_start', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (await hydrate((data ?? []) as JobRow[])).map(toOrderItem);
}

/** One order by its number (ORD-1001), or null when it does not exist. */
export async function getOrder(jobNumber: string): Promise<FullOrderData | null> {
  if (!/^ORD-\d+$/.test(jobNumber)) return null;
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('job_number', jobNumber)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const [hydrated] = await hydrate([data as JobRow]);
  return toFullOrder(hydrated);
}

/**
 * What the schedule board shows: the pours on one day (yyyy-MM-dd) and the upcoming orders
 * that still need a pump.
 */
export async function listSchedule(
  date: string,
): Promise<{ bookings: ScheduleBooking[]; unassigned: ScheduleBooking[] }> {
  const session = await requireSession();
  const supabase = await createClient();
  const today = todayIn(session.timezone);

  const [day, upcoming] = await Promise.all([
    supabase
      .from('jobs')
      .select(JOB_COLUMNS)
      .eq('service_date', date)
      .neq('booking_status', 'cancelled')
      .order('scheduled_start'),
    supabase
      .from('jobs')
      .select(JOB_COLUMNS)
      .gte('service_date', today)
      .neq('booking_status', 'cancelled')
      .order('scheduled_start')
      .limit(200),
  ]);
  if (day.error) throw day.error;
  if (upcoming.error) throw upcoming.error;

  const dayJobs = await hydrate((day.data ?? []) as JobRow[]);
  const upcomingJobs = await hydrate((upcoming.data ?? []) as JobRow[]);

  return {
    bookings: dayJobs.filter((h) => h.pump).map(toBooking),
    unassigned: upcomingJobs.filter((h) => !h.pump).map(toBooking),
  };
}

/** The pours on pumps on one day (yyyy-MM-dd), for the overlap warning in the order form. */
export async function listDayBlocks(date: string): Promise<DayBlock[]> {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('service_date', date)
    .neq('booking_status', 'cancelled')
    .order('scheduled_start');
  if (error) throw error;
  const jobs = await hydrate((data ?? []) as JobRow[]);
  return jobs
    .filter((h) => h.pump)
    .map(toBooking)
    .map((b) => ({
      id: b.id,
      pumpId: b.pumpId,
      startHour: b.startHour,
      durationHours: b.durationHours,
      customerName: b.customerName,
      orderNumber: b.orderNumber,
    }));
}

/**
 * The jobs an operator is on that deleting them would change: not cancelled and not finished.
 * Soonest first. Matches what the delete itself takes them off.
 */
export async function listOperatorJobs(employeeId: string): Promise<OperatorJob[]> {
  await requireSession();
  const supabase = await createClient();

  const { data: assignments, error: assignmentError } = await supabase
    .from('job_employee_assignments')
    .select('job_id, assignment_type')
    .eq('employee_id', employeeId)
    .is('released_at', null);
  if (assignmentError) throw assignmentError;
  if (!assignments?.length) return [];

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select(JOB_COLUMNS)
    .in('id', assignments.map((a) => a.job_id))
    .neq('booking_status', 'cancelled')
    .neq('field_status', 'done')
    .order('scheduled_start');
  if (error) throw error;

  const role = new Map(assignments.map((a) => [a.job_id, a.assignment_type]));
  const hydrated = await hydrate((jobs ?? []) as JobRow[]);
  return hydrated.map((h) => {
    const booking = toBooking(h);
    return {
      id: h.job.id,
      jobNumber: h.job.job_number,
      customerName: booking.customerName,
      dateLabel: format(parseISO(booking.serviceDate ?? h.job.service_date), 'EEE, MMM d'),
      timeLabel: booking.pourTimeLabel ?? '',
      pumpCode: booking.pumpCode ?? '',
      dispatched: h.job.dispatch_status === 'dispatched' || h.job.dispatch_status === 'acknowledged',
      isAdditionalOperator: role.get(h.job.id) !== 'primary_operator',
    };
  });
}

/** Orders on each day from `from` to `to` (yyyy-MM-dd, both included), cancelled ones left out. */
export async function listDayCounts(from: string, to: string): Promise<DayCounts> {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('service_date, booking_status')
    .gte('service_date', from)
    .lte('service_date', to)
    .neq('booking_status', 'cancelled');
  if (error) throw error;

  const counts: DayCounts = {};
  for (const job of data ?? []) {
    const day = (counts[job.service_date] ??= { total: 0, pending: 0 });
    day.total += 1;
    if (job.booking_status === 'pending') day.pending += 1;
  }
  return counts;
}

/** The counts shown next to Schedule and Orders in the sidebar. */
export async function getNavCounts(): Promise<NavCounts> {
  const session = await requireSession();
  const supabase = await createClient();
  const today = todayIn(session.timezone);
  const [todayJobs, upcoming] = await Promise.all([
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('service_date', today)
      .neq('booking_status', 'cancelled'),
    supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .gte('service_date', today)
      .neq('booking_status', 'cancelled'),
  ]);
  return { today: todayJobs.count ?? 0, orders: upcoming.count ?? 0 };
}
