import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, outbox, ClockEntry } from '@/api';
import {
  applyClockAction,
  ClockAction,
  dayRange,
  findOpenEntry,
  weekRange,
  workedBetween,
} from '@/features/time-clock';
import { startOfWeekMonday } from '@/lib/dates';

const MINUTE_MS = 60 * 1000;
/** Old demo hours kept on the phone. They are removed once and never uploaded. */
const LEGACY_STORAGE_KEY = '@pumpdesk/mock_time_clock';

let legacyCleared = false;
function clearLegacyEntries() {
  if (legacyCleared) return;
  legacyCleared = true;
  AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
}

/** The shifts overlapping [from, to), with taps still waiting in the outbox laid on top. */
export function useTimeEntries(from: Date, to: Date) {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  return useQuery<ClockEntry[]>({
    queryKey: ['time-entries', fromIso, toIso],
    queryFn: async () => {
      const entries = await api.listTimeEntries(fromIso, toIso);
      // A tap that is not on the server yet must not vanish when fresh data arrives.
      return outbox
        .getQueue()
        .reduce(
          (acc, item) =>
            item.action === 'clock_in' || item.action === 'clock_out'
              ? applyClockAction(acc, item.action, item.payload.at)
              : acc,
          entries
        );
    },
  });
}

/** Current time that moves once a minute while `active`. */
export function useMinuteNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0); // fresh time right away when the clock starts
    const id = setInterval(tick, MINUTE_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [active]);
  return now;
}

/** Clock in / clock out: shown at once, queued in the outbox, sent when there is signal. */
export function useClockTaps() {
  const queryClient = useQueryClient();
  const tap = useMutation({
    mutationFn: async ({ action, at }: { action: ClockAction; at: string }) => {
      // Also when the list has not loaded (no signal at launch): the tap must still show.
      queryClient.setQueriesData<ClockEntry[]>({ queryKey: ['time-entries'] }, (old) =>
        applyClockAction(old ?? [], action, at)
      );
      await outbox.enqueue(action, '', { at });
      await outbox.processQueue(api);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
  const clockIn = useCallback(() => tap.mutate({ action: 'clock_in', at: new Date().toISOString() }), [tap]);
  const clockOut = useCallback(() => tap.mutate({ action: 'clock_out', at: new Date().toISOString() }), [tap]);
  return { clockIn, clockOut };
}

/** This week's shifts plus today's and the week's totals. Moves once a minute while on the clock. */
export function useTimeClock() {
  useEffect(clearLegacyEntries, []);
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const week = useMemo(() => weekRange(weekStart), [weekStart]);
  const query = useTimeEntries(week.from, week.to);
  const entries = useMemo(() => query.data ?? [], [query.data]);
  const openEntry = findOpenEntry(entries);
  const now = useMinuteNow(!!openEntry);
  const taps = useClockTaps();

  // Open past Monday midnight: move on to the new week.
  const currentWeekStart = startOfWeekMonday(new Date(now));
  if (currentWeekStart.getTime() !== weekStart.getTime()) setWeekStart(currentWeekStart);

  const today = dayRange(new Date(now));
  return {
    entries,
    openEntry,
    now,
    workedToday: workedBetween(entries, today.from, today.to, now),
    workedWeek: workedBetween(entries, week.from, week.to, now),
    isLoading: query.isLoading,
    /** The hours could not be loaded (no signal, or the server refused). */
    loadFailed: query.isError,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    ...taps,
  };
}
