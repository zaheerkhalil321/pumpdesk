'use client';

import { useSyncExternalStore } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';

const TIME_ZONE = 'America/Chicago';

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 15_000);
  return () => clearInterval(id);
}

function getSnapshot() {
  return formatInTimeZone(new Date(), TIME_ZONE, 'EEE h:mm a');
}

function getServerSnapshot() {
  return '';
}

/** Live Central Time readout, e.g. "Thu 6:42 AM CT". Renders empty on the server. */
export function CentralClock({ className }: { className?: string }) {
  const time = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <time className={cn('font-mono text-[11px] tabular-nums text-muted-foreground', className)}>
      {time ? `${time} CT` : ' '}
    </time>
  );
}
