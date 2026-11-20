'use client';

import { format, parseISO } from 'date-fns';
import { ChevronRight, PenLine } from 'lucide-react';

import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';
import type { TicketItem } from '@/features/tickets/types';
import { cn } from '@/lib/utils';

interface TicketsTableProps {
  tickets: TicketItem[];
  onOpen: (ticket: TicketItem) => void;
}

const day = (iso: string) => format(parseISO(iso), 'MMM d');
const yards = (t: TicketItem) => (t.yardsPumped === null ? '—' : `${t.yardsPumped}`);

/** The tickets as a table on wide screens and as cards on phones. A row or card opens the ticket. */
export function TicketsTable({ tickets, onOpen }: TicketsTableProps) {
  return (
    <>
      {/* Phones: one card per ticket */}
      <ul className="space-y-2 md:hidden">
        {tickets.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onOpen(t)}
              className={cn(
                'w-full cursor-pointer rounded-xl border bg-white p-3.5 text-left shadow-2xs transition-colors hover:border-brand/40',
                t.state === 'needs_review' ? 'border-amber-200' : 'border-slate-200/90',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{t.customerName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {t.orderNumber} · {day(t.serviceDate)}
                  </p>
                </div>
                <TicketStatusBadge state={t.state} />
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2.5 text-xs">
                <span className="min-w-0">
                  <span className="block text-[10px] text-slate-400">Operator</span>
                  <span className="block truncate font-semibold text-slate-700">{t.operatorName}</span>
                </span>
                <span>
                  <span className="block text-[10px] text-slate-400">Yards</span>
                  <span className="block font-semibold text-slate-700">{yards(t)}</span>
                </span>
                <span>
                  <span className="block text-[10px] text-slate-400">Pump hrs</span>
                  <span className="block font-semibold text-slate-700">{t.pumpHours ?? '—'}</span>
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {/* Wider screens: a table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-2xs md:block">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer & site</th>
              <th className="px-4 py-3">Operator & pump</th>
              <th className="px-4 py-3 text-right">Yards</th>
              <th className="px-4 py-3 text-right">Pump hrs</th>
              <th className="px-4 py-3 text-center">Signed</th>
              <th className="px-4 py-3">Status</th>
              <th className="w-8 px-2 py-3" aria-label="Open" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => onOpen(t)}
                className={cn(
                  'group cursor-pointer transition-colors hover:bg-slate-50/70',
                  t.state === 'needs_review' && 'bg-amber-50/30',
                )}
              >
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">{day(t.serviceDate)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] font-semibold text-slate-600">
                  {t.orderNumber}
                </td>
                <td className="max-w-[16rem] px-4 py-3">
                  <p className="truncate font-bold text-slate-900">{t.customerName}</p>
                  <p className="truncate text-[11px] text-slate-500">{t.siteAddress || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="truncate font-semibold text-slate-800">{t.operatorName}</p>
                  <p className="text-[11px] text-slate-500">{t.pumpCode ? `Pump ${t.pumpCode}` : 'No pump'}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                  <span className="font-bold text-slate-900">{yards(t)}</span>
                  {t.estimatedYards > 0 && <span className="text-slate-400"> / {t.estimatedYards}</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-800">
                  {t.pumpHours ?? '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  {t.hasSignature ? (
                    <PenLine className="mx-auto h-3.5 w-3.5 text-emerald-600" aria-label="Signed" />
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TicketStatusBadge state={t.state} />
                </td>
                <td className="px-2 py-3 text-slate-300 transition-colors group-hover:text-brand">
                  <ChevronRight className="h-4 w-4" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
