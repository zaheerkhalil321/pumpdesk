import type { TicketDatePreset, TicketState } from './types';

/** Badge and dot colours for each ticket state. */
export const TICKET_STATE_STYLE: Record<TicketState, { badge: string; dot: string }> = {
  in_progress: { badge: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  needs_review: { badge: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
  reviewed: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
};

export const TICKET_DATE_PRESETS: { value: TicketDatePreset; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'custom', label: 'Custom range' },
];
