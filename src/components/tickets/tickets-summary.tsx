import type { ComponentType } from 'react';
import { ClipboardCheck, Clock, FileText, Ruler } from 'lucide-react';

import type { TicketTotals } from '@/features/tickets/types';
import { cn } from '@/lib/utils';

interface StatProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  /** Draws the eye, e.g. tickets that wait for review. */
  highlight?: boolean;
  onClick?: () => void;
}

function Stat({ icon: Icon, label, value, hint, highlight, onClick }: StatProps) {
  const Box = onClick ? 'button' : 'div';
  return (
    <Box
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-xl border bg-white p-3.5 text-left shadow-2xs transition-colors sm:p-4',
        highlight ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200/90',
        onClick && 'cursor-pointer hover:border-brand/40',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
          highlight ? 'border-amber-200 bg-white text-amber-600' : 'border-brand/20 bg-brand-light text-brand',
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold text-slate-500">{label}</span>
        <span className="block text-lg font-bold leading-tight text-slate-900 tabular-nums">{value}</span>
        <span className="block truncate text-[11px] text-slate-400">{hint}</span>
      </span>
    </Box>
  );
}

/** Four cards over the list, for the tickets the filters show. "Needs review" also filters to them. */
export function TicketsSummary({ totals, onShowNeedsReview }: { totals: TicketTotals; onShowNeedsReview: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      <Stat
        icon={ClipboardCheck}
        label="Needs review"
        value={String(totals.needsReview)}
        hint={totals.needsReview ? 'Tap to see them' : 'All caught up'}
        highlight={totals.needsReview > 0}
        onClick={onShowNeedsReview}
      />
      <Stat icon={FileText} label="Tickets" value={String(totals.count)} hint="In this view" />
      <Stat icon={Ruler} label="Yards pumped" value={`${totals.yardsPumped} yd³`} hint="Turned-in tickets" />
      <Stat icon={Clock} label="Pump hours" value={`${totals.pumpHours} h`} hint="Pour start to finish" />
    </div>
  );
}
