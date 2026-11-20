'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { updateOrder } from '@/features/orders/server/actions';
import type { TicketItem } from '@/features/tickets/types';
import { reportAction } from '@/lib/action-feedback';

/**
 * "Mark reviewed" on a turned-in ticket, "Reopen review" on a reviewed one. Reviewing a ticket moves its
 * order to Reviewed; reopening moves it back to Turned in. A draft has nothing to review yet.
 */
export function TicketReviewButton({ ticket, className }: { ticket: TicketItem; className?: string }) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  if (ticket.state === 'in_progress') return null;

  const reviewed = ticket.state === 'reviewed';
  const toggle = () =>
    startSaving(async () => {
      const result = await updateOrder({
        id: ticket.jobId,
        version: ticket.jobVersion,
        bookingStatus: reviewed ? 'turned_in' : 'reviewed',
      });
      if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
      toast.success(reviewed ? 'Review reopened' : 'Ticket reviewed', {
        description: `${ticket.orderNumber} · ${ticket.customerName}`,
      });
      router.refresh();
    });

  return (
    <Button
      type="button"
      variant={reviewed ? 'outline' : 'brand'}
      size="sm"
      disabled={saving}
      onClick={toggle}
      className={className}
    >
      {saving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : reviewed ? (
        <RotateCcw className="h-3.5 w-3.5" />
      ) : (
        <CheckCheck className="h-3.5 w-3.5" />
      )}
      {reviewed ? 'Reopen review' : 'Mark reviewed'}
    </Button>
  );
}
