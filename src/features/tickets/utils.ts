import { addDays, endOfMonth, format, getISODay, parseISO, startOfMonth, subMonths } from 'date-fns';

import type { TicketDatePreset, TicketFilters, TicketItem, TicketState, TicketTotals } from './types';

const ISO = 'yyyy-MM-dd';

export const EMPTY_TICKET_FILTERS: TicketFilters = {
  search: '',
  state: 'all',
  datePreset: 'all',
  from: '',
  to: '',
  customerId: 'all',
  operatorId: 'all',
  pumpId: 'all',
};

/** Hours between two ISO times, to two decimals; null when either is missing or the end is not after the start. */
export function hoursBetween(startIso: string | null, endIso: string | null): number | null {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Math.round((ms / 3_600_000) * 100) / 100;
}

/** A draft is still with the operator; a turned-in ticket waits for review until the order is marked reviewed. */
export function ticketStateOf(ticketStatus: string, bookingStatus: string): TicketState {
  if (ticketStatus !== 'submitted') return 'in_progress';
  return bookingStatus === 'reviewed' ? 'reviewed' : 'needs_review';
}

/** The days a preset covers, as yyyy-MM-dd, counted from today (in the company's timezone). Weeks start Monday. */
export function dateRangeFor(
  preset: TicketDatePreset,
  todayIso: string,
  custom: { from: string; to: string } = { from: '', to: '' },
): { from: string; to: string } {
  const today = parseISO(todayIso);
  switch (preset) {
    case 'this_week': {
      const monday = addDays(today, 1 - getISODay(today));
      return { from: format(monday, ISO), to: format(addDays(monday, 6), ISO) };
    }
    case 'this_month':
      return { from: format(startOfMonth(today), ISO), to: format(endOfMonth(today), ISO) };
    case 'last_month': {
      const last = subMonths(today, 1);
      return { from: format(startOfMonth(last), ISO), to: format(endOfMonth(last), ISO) };
    }
    case 'custom':
      return custom;
    default:
      return { from: '', to: '' };
  }
}

/** The tickets that match every filter. Search looks at the order, customer, site, operator and pump. */
export function filterTickets(tickets: TicketItem[], filters: TicketFilters, todayIso: string): TicketItem[] {
  const { from, to } = dateRangeFor(filters.datePreset, todayIso, { from: filters.from, to: filters.to });
  const query = filters.search.trim().toLowerCase();
  return tickets.filter((t) => {
    if (filters.state !== 'all' && t.state !== filters.state) return false;
    if (from && t.serviceDate < from) return false;
    if (to && t.serviceDate > to) return false;
    if (filters.customerId !== 'all' && t.customerId !== filters.customerId) return false;
    if (filters.operatorId !== 'all' && t.operatorId !== filters.operatorId) return false;
    if (filters.pumpId !== 'all' && t.pumpId !== filters.pumpId) return false;
    if (!query) return true;
    return [t.orderNumber, t.customerName, t.siteAddress, t.operatorName, t.pumpCode]
      .some((value) => value.toLowerCase().includes(query));
  });
}

/** Counts and sums for the summary cards. Drafts count as tickets but add no yards or hours yet. */
export function ticketTotals(tickets: TicketItem[]): TicketTotals {
  let yardsPumped = 0;
  let pumpHours = 0;
  let needsReview = 0;
  for (const t of tickets) {
    if (t.state === 'needs_review') needsReview++;
    if (t.state === 'in_progress') continue;
    yardsPumped += t.yardsPumped ?? 0;
    pumpHours += t.pumpHours ?? 0;
  }
  return {
    count: tickets.length,
    needsReview,
    yardsPumped: Math.round(yardsPumped * 10) / 10,
    pumpHours: Math.round(pumpHours * 10) / 10,
  };
}

/** True when any filter differs from the defaults. */
export function hasActiveFilters(filters: TicketFilters): boolean {
  return (Object.keys(EMPTY_TICKET_FILTERS) as (keyof TicketFilters)[]).some(
    (key) => filters[key] !== EMPTY_TICKET_FILTERS[key],
  );
}

/** The rows as CSV, one ticket per line, for a spreadsheet. */
export function ticketsToCsv(tickets: TicketItem[]): string {
  const header = [
    'Date', 'Order', 'Customer', 'Site', 'Operator', 'Pump', 'Status',
    'Yards pumped', 'Estimated yards', 'Pump hours', 'On-site hours', '3" hose (ft)', '4" hose (ft)',
    'Extras', 'Signed by', 'Comments',
  ];
  const cell = (value: string | number | null) => {
    const text = value === null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const rows = tickets.map((t) =>
    [
      t.serviceDate, t.orderNumber, t.customerName, t.siteAddress, t.operatorName, t.pumpCode,
      TICKET_STATE_LABEL[t.state], t.yardsPumped, t.estimatedYards, t.pumpHours, t.onSiteHours,
      t.hose3inFt, t.hose4inFt, t.extras.join('; '), t.signerName, t.comments,
    ].map(cell).join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export const TICKET_STATE_LABEL: Record<TicketState, string> = {
  in_progress: 'In progress',
  needs_review: 'Needs review',
  reviewed: 'Reviewed',
};
