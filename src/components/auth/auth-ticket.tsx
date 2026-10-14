import { PumpDeskLogo } from '@/components/ui/pumpdesk-logo';
import { CentralClock } from '@/components/auth/central-clock';
import { cn } from '@/lib/utils';

/** Dashed tear line with half-circle notches cut into both card edges. */
function TicketPerforation() {
  return (
    <div aria-hidden="true" className="relative flex h-5 items-center">
      <span className="absolute -left-2.5 size-5 rounded-full border border-border bg-muted [clip-path:inset(0_0_0_50%)]" />
      <span className="mx-5 w-full border-t-2 border-dashed border-border" />
      <span className="absolute -right-2.5 size-5 rounded-full border border-border bg-muted [clip-path:inset(0_50%_0_0)]" />
    </div>
  );
}

interface AuthTicketProps {
  /** Short screen label printed in the ticket header, e.g. "Sign In" or "Reset 1/2" */
  label?: string;
  /** Content for the tear-off stub under the perforation */
  stub?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Card shell for every auth screen, modelled on a paper pour ticket:
 * header strip, main body, perforation, and a small stub with the live clock.
 */
export function AuthTicket({ label, stub, children, className }: AuthTicketProps) {
  return (
    <section
      className={cn(
        'relative rounded-lg border border-border bg-card shadow-xl shadow-foreground/[0.05]',
        className
      )}
    >
      <header
        className={cn(
          'flex items-center border-b border-border px-6 py-4 sm:px-8',
          label ? 'justify-between' : 'justify-center'
        )}
      >
        <PumpDeskLogo size="sm" showBadge={false} />
        {label && (
          <span className="font-mono text-[11px] font-medium tracking-[0.14em] text-muted-foreground">
            {label}
          </span>
        )}
      </header>

      <div className="px-6 pb-8 pt-7 sm:px-8">{children}</div>

      <TicketPerforation />

      <footer className="flex min-h-12 items-center justify-between gap-4 px-6 pb-4 pt-2 text-xs text-muted-foreground sm:px-8">
        <div className="min-w-0">{stub}</div>
        <CentralClock className="shrink-0" />
      </footer>
    </section>
  );
}
