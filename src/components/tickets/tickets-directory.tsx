'use client';

import { useMemo, useState } from 'react';
import { FileText } from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';
import type { SelectOption } from '@/components/ui/app-select';
import { TicketDrawer } from '@/components/tickets/ticket-drawer';
import { TicketsSummary } from '@/components/tickets/tickets-summary';
import { TicketsTable } from '@/components/tickets/tickets-table';
import { TicketsToolbar } from '@/components/tickets/tickets-toolbar';
import type { TicketFilters, TicketItem } from '@/features/tickets/types';
import {
  EMPTY_TICKET_FILTERS,
  filterTickets,
  hasActiveFilters,
  ticketTotals,
  ticketsToCsv,
} from '@/features/tickets/utils';

/** Each distinct value once, sorted by label, for a filter dropdown. */
function optionsOf(tickets: TicketItem[], pick: (t: TicketItem) => SelectOption | null): SelectOption[] {
  const byValue = new Map<string, SelectOption>();
  for (const t of tickets) {
    const option = pick(t);
    if (option) byValue.set(option.value, option);
  }
  return [...byValue.values()].sort((a, b) => a.label.localeCompare(b.label));
}

interface TicketsDirectoryProps {
  tickets: TicketItem[];
  /** yyyy-MM-dd in the company's timezone, for the date presets. */
  todayIso: string;
}

/** The Tickets page: what waits for review, the totals, the filters and the list. */
export function TicketsDirectory({ tickets, todayIso }: TicketsDirectoryProps) {
  const [filters, setFilters] = useState<TicketFilters>(EMPTY_TICKET_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);

  const shown = useMemo(() => filterTickets(tickets, filters, todayIso), [tickets, filters, todayIso]);
  const totals = useMemo(() => ticketTotals(shown), [shown]);
  // The open ticket comes from the latest data, so a review shows at once after the page refreshes.
  const openTicket = tickets.find((t) => t.id === openId) ?? null;

  const customers = useMemo(() => optionsOf(tickets, (t) => ({ value: t.customerId, label: t.customerName })), [tickets]);
  const operators = useMemo(() => optionsOf(tickets, (t) => ({ value: t.operatorId, label: t.operatorName })), [tickets]);
  const pumps = useMemo(
    () => optionsOf(tickets, (t) => (t.pumpId ? { value: t.pumpId, label: `Pump ${t.pumpCode}` } : null)),
    [tickets],
  );

  const exportCsv = () => {
    const blob = new Blob([ticketsToCsv(shown)], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `work-tickets-${todayIso}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="w-full space-y-4 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Work tickets"
        description="What operators turned in from the field. Check each one and mark it reviewed."
        borderBottom
      />

      <TicketsSummary totals={totals} onShowNeedsReview={() => setFilters((f) => ({ ...f, state: 'needs_review' }))} />

      <TicketsToolbar
        filters={filters}
        onChange={(next) => setFilters((f) => ({ ...f, ...next }))}
        onClear={() => setFilters(EMPTY_TICKET_FILTERS)}
        canClear={hasActiveFilters(filters)}
        customers={customers}
        operators={operators}
        pumps={pumps}
        onExport={exportCsv}
        exportDisabled={shown.length === 0}
      />

      {shown.length ? (
        <TicketsTable tickets={shown} onOpen={(t) => setOpenId(t.id)} />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/20 bg-brand-light text-brand">
            <FileText className="h-5 w-5" />
          </span>
          <p className="text-sm font-bold text-slate-900">
            {tickets.length ? 'No tickets match these filters' : 'No work tickets yet'}
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            {tickets.length
              ? 'Try another date range or clear the filters.'
              : 'Tickets show here once operators fill them in on the PumpDesk phone app.'}
          </p>
          {hasActiveFilters(filters) && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_TICKET_FILTERS)}
              className="mt-1 cursor-pointer text-xs font-semibold text-brand hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <TicketDrawer ticket={openTicket} onOpenChange={(open) => !open && setOpenId(null)} />
    </div>
  );
}
