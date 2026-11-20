import { FileText } from 'lucide-react';

import { TicketDetail } from '@/components/tickets/ticket-detail';
import type { TicketItem } from '@/features/tickets/types';

/** The work ticket on the order page, or a note that the operator has not started one. */
export function OrderTicketCard({ ticket }: { ticket: TicketItem | null | undefined }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
      <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <FileText className="h-4 w-4 text-slate-400" />
        Work ticket
      </h2>
      {ticket ? (
        <TicketDetail ticket={ticket} showOrderLink={false} />
      ) : (
        <p className="rounded-xl border border-slate-200/60 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
          The operator has not started a work ticket for this order yet. It shows here once they fill it in on
          the phone app.
        </p>
      )}
    </div>
  );
}
