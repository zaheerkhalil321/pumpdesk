import { TICKET_STATE_STYLE } from '@/features/tickets/constants';
import { TICKET_STATE_LABEL } from '@/features/tickets/utils';
import type { TicketState } from '@/features/tickets/types';
import { cn } from '@/lib/utils';

/** "Needs review", "Reviewed" or "In progress", in the state's colour. */
export function TicketStatusBadge({ state, className }: { state: TicketState; className?: string }) {
  const style = TICKET_STATE_STYLE[state];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        style.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', style.dot)} />
      {TICKET_STATE_LABEL[state]}
    </span>
  );
}
