import { MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { DeliveryStatus, OrderDelivery } from '@/features/notifications/events';
import { formatE164 } from '@/lib/phone';

const STATUS_LABEL: Record<DeliveryStatus, string> = {
  pending: 'Waiting to send',
  sending: 'Sending',
  sent: 'Sent',
  failed: 'Failed',
  skipped: 'Not sent',
};

const SKIP_LABEL: Record<string, string> = {
  no_phone: 'no phone number',
  order_cancelled: 'order cancelled',
  rule_off: 'message turned off',
  customer_off: 'turned off for this customer',
  no_operator: 'no operator assigned',
};

function statusText(delivery: OrderDelivery): string {
  if (delivery.status === 'sent' && delivery.dryRun) return 'Logged only (not sent)';
  const base = STATUS_LABEL[delivery.status];
  const reason = delivery.skipReason ? (SKIP_LABEL[delivery.skipReason] ?? delivery.skipReason) : null;
  return delivery.status === 'skipped' && reason ? `${base}: ${reason}` : base;
}

/** The automatic customer texts for this order: what, to whom, and what happened. Read only. */
export function OrderCustomerTexts({ deliveries }: { deliveries: OrderDelivery[] }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
      <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        Customer texts
      </h2>
      {deliveries.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          No automatic texts for this order yet.
        </p>
      ) : (
        <ul className="divide-y divide-border text-xs">
          {deliveries.map((delivery) => (
            <li key={delivery.id} className="flex items-start justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{delivery.label}</p>
                <p className="mt-0.5 text-muted-foreground">
                  {delivery.recipient}
                  {delivery.phone ? ` · ${formatE164(delivery.phone)}` : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    'font-semibold',
                    delivery.status === 'failed' ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {statusText(delivery)}
                </p>
                <p className="mt-0.5 text-muted-foreground">{delivery.at}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
