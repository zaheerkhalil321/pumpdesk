'use client';

import { Download, Search, X } from 'lucide-react';

import { AppSelect, type SelectOption } from '@/components/ui/app-select';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { TICKET_DATE_PRESETS } from '@/features/tickets/constants';
import type { TicketDatePreset, TicketFilters, TicketState } from '@/features/tickets/types';
import { cn } from '@/lib/utils';

const STATE_OPTIONS: { value: TicketState | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'in_progress', label: 'In progress' },
];

interface TicketsToolbarProps {
  filters: TicketFilters;
  onChange: (next: Partial<TicketFilters>) => void;
  onClear: () => void;
  canClear: boolean;
  customers: SelectOption[];
  operators: SelectOption[];
  pumps: SelectOption[];
  onExport: () => void;
  exportDisabled: boolean;
}

const selectClass = 'h-9 text-xs';
/** AppSelect fills its parent, so each one sits in a box that sets the width. */
const selectBox = 'w-full sm:w-44';

/** Search, the status switch, and the date, customer, operator and pump filters. */
export function TicketsToolbar({
  filters,
  onChange,
  onClear,
  canClear,
  customers,
  operators,
  pumps,
  onExport,
  exportDisabled,
}: TicketsToolbarProps) {
  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs sm:p-3">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
        <div className="group relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search order #, customer, site, operator or pump"
            aria-label="Search tickets"
            className="h-9 w-full rounded-lg border-slate-200 bg-slate-50/50 pl-9 pr-9 text-xs shadow-none focus-visible:bg-white"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onChange({ search: '' })}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="no-scrollbar shrink-0 overflow-x-auto">
          <SegmentedControl
            value={filters.state}
            onChange={(state) => onChange({ state })}
            options={STATE_OPTIONS}
            ariaLabel="Ticket status"
            size="sm"
            className="w-max min-w-full [&_button]:whitespace-nowrap"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className={selectBox}>
          <AppSelect
            size="sm"
            value={filters.datePreset}
            onChange={(value) => onChange({ datePreset: value as TicketDatePreset })}
            options={TICKET_DATE_PRESETS}
            className={selectClass}
          />
        </div>
        {filters.datePreset === 'custom' && (
          <div className="flex items-center gap-1.5">
            <DatePicker
              size="sm"
              value={filters.from}
              onChange={(from) => onChange({ from })}
              placeholder="From"
              ariaLabel="From date"
              className="w-36"
            />
            <span className="text-xs text-slate-400">to</span>
            <DatePicker
              size="sm"
              value={filters.to}
              onChange={(to) => onChange({ to })}
              placeholder="To"
              ariaLabel="To date"
              className="w-36"
            />
          </div>
        )}
        <div className={selectBox}>
          <AppSelect
            size="sm"
            value={filters.customerId}
            onChange={(customerId) => onChange({ customerId })}
            options={[{ value: 'all', label: 'All customers' }, ...customers]}
            className={selectClass}
            contentClassName="max-h-64"
          />
        </div>
        <div className={selectBox}>
          <AppSelect
            size="sm"
            value={filters.operatorId}
            onChange={(operatorId) => onChange({ operatorId })}
            options={[{ value: 'all', label: 'All operators' }, ...operators]}
            className={selectClass}
            contentClassName="max-h-64"
          />
        </div>
        <div className={selectBox}>
          <AppSelect
            size="sm"
            value={filters.pumpId}
            onChange={(pumpId) => onChange({ pumpId })}
            options={[{ value: 'all', label: 'All pumps' }, ...pumps]}
            className={selectClass}
            contentClassName="max-h-64"
          />
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {canClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
          <button
            type="button"
            onClick={onExport}
            disabled={exportDisabled}
            className={cn(
              'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
