import 'server-only';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';
import { formatE164 } from '@/lib/phone';
import { JOB_COLUMNS, type JobRow } from '@/features/orders/mappers';
import { hydrate } from '@/features/orders/server/queries';
import { hoursBetween, ticketStateOf } from '@/features/tickets/utils';
import type { TicketItem } from '@/features/tickets/types';

const TICKET_COLUMNS =
  'id, job_id, employee_id, status, arrived_on_site_at, started_pour_at, finished_pour_at, departed_site_at, yards_pumped, hose_3in_ft, hose_4in_ft, comments, signer_name, signature_path, signed_at, submitted_at, updated_at';

/**
 * Work tickets with their order, customer, site, pump and operator. Newest turned-in first, drafts last.
 * Read through the user client, so RLS keeps it to the signed-in company.
 */
async function loadTickets(jobId?: string): Promise<TicketItem[]> {
  await requireSession();
  const supabase = await createClient();

  let ticketQuery = supabase
    .from('work_tickets')
    .select(TICKET_COLUMNS)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .order('updated_at', { ascending: false });
  if (jobId) ticketQuery = ticketQuery.eq('job_id', jobId);
  const { data: tickets, error } = await ticketQuery;
  if (error) throw error;
  if (!tickets?.length) return [];

  const ticketIds = tickets.map((t) => t.id);
  const jobIds = [...new Set(tickets.map((t) => t.job_id))];
  const employeeIds = [...new Set(tickets.map((t) => t.employee_id))];

  const [jobs, employees, ticketExtras, extraLabels] = await Promise.all([
    supabase.from('jobs').select(JOB_COLUMNS).in('id', jobIds),
    supabase.from('employees').select('id, first_name, last_name, phone').in('id', employeeIds),
    supabase.from('work_ticket_extras').select('ticket_id, extra_code').in('ticket_id', ticketIds),
    supabase.from('ticket_extras').select('code, label'),
  ]);
  for (const result of [jobs, employees, ticketExtras, extraLabels]) {
    if (result.error) throw result.error;
  }

  const hydrated = await hydrate((jobs.data ?? []) as JobRow[]);
  const jobById = new Map(hydrated.map((h) => [h.job.id, h]));
  const employeeById = new Map((employees.data ?? []).map((e) => [e.id, e]));
  const labelByCode = new Map((extraLabels.data ?? []).map((x) => [x.code, x.label]));
  const extrasByTicket = new Map<string, string[]>();
  for (const row of ticketExtras.data ?? []) {
    const list = extrasByTicket.get(row.ticket_id) ?? [];
    list.push(labelByCode.get(row.extra_code) ?? row.extra_code);
    extrasByTicket.set(row.ticket_id, list);
  }

  return tickets.flatMap((t): TicketItem[] => {
    const h = jobById.get(t.job_id);
    if (!h) return [];
    const employee = employeeById.get(t.employee_id);
    const job = h.job;
    return [
      {
        id: t.id,
        jobId: job.id,
        orderNumber: job.job_number,
        jobVersion: job.version,
        serviceDate: job.service_date,
        timezone: job.timezone,
        customerId: job.customer_id,
        customerName: h.customerName,
        siteAddress: h.siteAddress || job.site_label || '',
        pourType: job.pour_type ?? '',
        operatorId: t.employee_id,
        operatorName: employee ? `${employee.first_name} ${employee.last_name}`.trim() : 'Unknown operator',
        operatorPhone: formatE164(employee?.phone),
        pumpId: h.pump?.id ?? null,
        pumpCode: h.pump?.code ?? '',
        state: ticketStateOf(t.status, job.booking_status),
        arrivedAt: t.arrived_on_site_at,
        startedPourAt: t.started_pour_at,
        finishedPourAt: t.finished_pour_at,
        departedAt: t.departed_site_at,
        pumpHours: hoursBetween(t.started_pour_at, t.finished_pour_at),
        onSiteHours: hoursBetween(t.arrived_on_site_at, t.departed_site_at),
        estimatedYards: Number(job.estimated_yards ?? 0),
        yardsPumped: t.yards_pumped === null ? null : Number(t.yards_pumped),
        hose3inFt: t.hose_3in_ft === null ? null : Number(t.hose_3in_ft),
        hose4inFt: t.hose_4in_ft === null ? null : Number(t.hose_4in_ft),
        extras: extrasByTicket.get(t.id) ?? [],
        comments: t.comments,
        signerName: t.signer_name,
        hasSignature: Boolean(t.signature_path),
        signedAt: t.signed_at,
        submittedAt: t.submitted_at,
        updatedAt: t.updated_at,
      },
    ];
  });
}

/** Every work ticket of the company, for the Tickets page. */
export function listTickets(): Promise<TicketItem[]> {
  return loadTickets();
}

/** The work ticket of one order, or null when the operator has not started one. */
export async function getTicketForJob(jobId: string): Promise<TicketItem | null> {
  const [ticket] = await loadTickets(jobId);
  return ticket ?? null;
}
