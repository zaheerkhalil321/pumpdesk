import type { ReactNode } from 'react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { ArrowUpRight, Clock, MessageSquare, Package, PenLine, Ruler } from 'lucide-react';

import { TicketReviewButton } from '@/components/tickets/ticket-review-button';
import { TicketSignature } from '@/components/tickets/ticket-signature';
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';
import type { TicketItem } from '@/features/tickets/types';
import { cn } from '@/lib/utils';

/** "7:05 AM" in the order's timezone, or a dash when the step was not recorded. */
function clock(iso: string | null, timezone: string): string {
  return iso ? formatInTimeZone(iso, timezone, 'h:mm a') : '—';
}

/** 2.5 -> "2.5 h"; null -> dash. */
function hours(value: number | null): string {
  return value === null ? '—' : `${value} h`;
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5 rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={cn('truncate text-sm text-slate-900', strong ? 'font-bold' : 'font-semibold')}>{value}</p>
    </div>
  );
}

interface TicketDetailProps {
  ticket: TicketItem;
  /** Shows the link to the order page; off when already on it. */
  showOrderLink?: boolean;
}

/** Everything on a work ticket, laid out for the office to check, with the review action. */
export function TicketDetail({ ticket, showOrderLink = true }: TicketDetailProps) {
  const tz = ticket.timezone;
  const yardsDiff =
    ticket.yardsPumped === null ? null : Math.round((ticket.yardsPumped - ticket.estimatedYards) * 10) / 10;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TicketStatusBadge state={ticket.state} />
          {ticket.submittedAt && (
            <span className="text-[11px] text-slate-500">
              Turned in {formatInTimeZone(ticket.submittedAt, tz, 'MMM d, h:mm a')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showOrderLink && (
            <Link
              href={`/orders/${ticket.orderNumber}`}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
            >
              Open order
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <TicketReviewButton ticket={ticket} className="h-8 gap-1.5 px-3 text-xs font-semibold" />
        </div>
      </div>

      {ticket.state === 'in_progress' && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {ticket.operatorName} is still filling in this ticket. It can be reviewed once it is turned in.
        </p>
      )}

      <Section icon={<Clock className="h-3.5 w-3.5" />} title="Times on site">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact label="Arrived" value={clock(ticket.arrivedAt, tz)} />
          <Fact label="Pour started" value={clock(ticket.startedPourAt, tz)} />
          <Fact label="Pour finished" value={clock(ticket.finishedPourAt, tz)} />
          <Fact label="Left site" value={clock(ticket.departedAt, tz)} />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2.5">
          <Fact label="Pump hours" value={hours(ticket.pumpHours)} strong />
          <Fact label="On site" value={hours(ticket.onSiteHours)} strong />
        </div>
      </Section>

      <Section icon={<Ruler className="h-3.5 w-3.5" />} title="Yards and hose">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact label="Pumped" value={ticket.yardsPumped === null ? '—' : `${ticket.yardsPumped} yd³`} strong />
          <Fact label="Estimated" value={ticket.estimatedYards ? `${ticket.estimatedYards} yd³` : '—'} />
          <Fact label='3" hose' value={ticket.hose3inFt === null ? '—' : `${ticket.hose3inFt} ft`} />
          <Fact label='4" hose' value={ticket.hose4inFt === null ? '—' : `${ticket.hose4inFt} ft`} />
        </div>
        {yardsDiff !== null && ticket.estimatedYards > 0 && yardsDiff !== 0 && (
          <p className={cn('text-xs font-medium', yardsDiff > 0 ? 'text-amber-700' : 'text-slate-500')}>
            {yardsDiff > 0 ? `${yardsDiff} yd³ more than estimated` : `${Math.abs(yardsDiff)} yd³ less than estimated`}
          </p>
        )}
      </Section>

      <Section icon={<Package className="h-3.5 w-3.5" />} title="Extras">
        {ticket.extras.length ? (
          <div className="flex flex-wrap gap-1.5">
            {ticket.extras.map((extra) => (
              <span
                key={extra}
                className="rounded-md border border-brand/20 bg-brand-light px-2 py-0.5 text-xs font-semibold text-brand"
              >
                {extra}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No extras.</p>
        )}
      </Section>

      <Section icon={<MessageSquare className="h-3.5 w-3.5" />} title="Operator comments">
        <p className="whitespace-pre-line text-sm text-slate-700">{ticket.comments || 'No comments.'}</p>
      </Section>

      <Section icon={<PenLine className="h-3.5 w-3.5" />} title="Customer signature">
        <TicketSignature
          ticketId={ticket.id}
          signerName={ticket.signerName}
          hasSignature={ticket.hasSignature}
          signedLabel={ticket.signedAt ? formatInTimeZone(ticket.signedAt, tz, 'MMM d, h:mm a') : null}
        />
      </Section>
    </div>
  );
}
