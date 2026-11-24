'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';

import type { BoardNow } from '@/components/schedule/live-status';

const TICK_MS = 30_000;
const REFRESH_MS = 30_000;

// One shared timer for every card on the board.
let tick = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  timer ??= setInterval(() => {
    tick += 1;
    listeners.forEach((l) => l());
  }, TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const getTick = () => tick;
// On the server there is no "now": live states appear once the page is in the browser.
const getServerTick = () => -1;

/** The company's date and hour, updated every 30 seconds. Null while rendering on the server. */
export function useBoardClock(timezone: string): BoardNow | null {
  const current = useSyncExternalStore(subscribe, getTick, getServerTick);
  if (current < 0) return null;
  const now = new Date();
  const [date, hh, mm] = formatInTimeZone(now, timezone, 'yyyy-MM-dd|HH|mm').split('|');
  return { date, hour: Number(hh) + Number(mm) / 60 };
}

/**
 * Re-reads the board every 30 seconds while today is shown and the tab is open, so steps from
 * the operator app (left shop, on site, done) show up without a reload.
 */
export function useLiveRefresh(enabled: boolean) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const id = setInterval(refresh, REFRESH_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [enabled, router]);
}
