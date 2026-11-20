'use client';

import { format, parseISO } from 'date-fns';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TicketDetail } from '@/components/tickets/ticket-detail';
import type { TicketItem } from '@/features/tickets/types';

interface TicketDrawerProps {
  ticket: TicketItem | null;
  onOpenChange: (open: boolean) => void;
}

/** A work ticket opened from the list, in a panel on the right (full width on phones). */
export function TicketDrawer({ ticket, onOpenChange }: TicketDrawerProps) {
  return (
    <Sheet open={ticket !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-l border-slate-200 bg-slate-50 p-0 sm:max-w-xl">
        {ticket && (
          <>
            <SheetHeader className="space-y-0.5 border-b border-slate-200 bg-white p-5 pb-4">
              <SheetTitle className="text-base font-bold text-slate-900">
                {ticket.orderNumber} · {ticket.customerName}
              </SheetTitle>
              <p className="text-xs text-slate-500">
                {format(parseISO(ticket.serviceDate), 'EEE, MMM d, yyyy')}
                {ticket.siteAddress && ` · ${ticket.siteAddress}`}
              </p>
              <p className="text-xs text-slate-500">
                {ticket.operatorName}
                {ticket.pumpCode && ` · Pump ${ticket.pumpCode}`}
              </p>
            </SheetHeader>
            <div className="p-4 sm:p-5">
              <TicketDetail ticket={ticket} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
