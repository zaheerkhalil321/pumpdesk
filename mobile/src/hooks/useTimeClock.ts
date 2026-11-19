import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Demo only: the real time clock is not in the backend yet, so entries live on the phone.
const STORAGE_KEY = '@pumpdesk/mock_time_clock';

export interface ClockEntry {
  clockedInAt: string; // ISO
  clockedOutAt: string | null; // null while on the clock
}

/** Worked milliseconds of `entries` that fall inside [from, to). */
export function workedBetween(entries: ClockEntry[], from: Date, to: Date, now: number): number {
  return entries.reduce((sum, entry) => {
    const start = Math.max(new Date(entry.clockedInAt).getTime(), from.getTime());
    const end = Math.min(entry.clockedOutAt ? new Date(entry.clockedOutAt).getTime() : now, to.getTime());
    return end > start ? sum + (end - start) : sum;
  }, 0);
}

export function useTimeClock() {
  const [entries, setEntries] = useState<ClockEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setEntries(JSON.parse(raw) as ClockEntry[]);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = useCallback((next: ClockEntry[]) => {
    setEntries(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const openEntry = entries.find((e) => !e.clockedOutAt) ?? null;

  const clockIn = useCallback(() => {
    if (openEntry) return;
    save([...entries, { clockedInAt: new Date().toISOString(), clockedOutAt: null }]);
  }, [entries, openEntry, save]);

  const clockOut = useCallback(() => {
    if (!openEntry) return;
    const at = new Date().toISOString();
    save(entries.map((e) => (e === openEntry ? { ...e, clockedOutAt: at } : e)));
  }, [entries, openEntry, save]);

  return { entries, loaded, openEntry, clockIn, clockOut };
}
