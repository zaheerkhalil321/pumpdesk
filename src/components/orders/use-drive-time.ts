'use client';

import { useEffect, useRef, useState } from 'react';

import { getDriveTime } from '@/features/orders/server/actions';

const DEBOUNCE_MS = 600;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DriveTimeStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'ready'; from: 'shop' | 'yard' | 'job'; yardName: string | null; minutes: number };

interface UseDriveTimeOptions {
  /** Off while editing a saved order, which keeps the drive time it has. */
  enabled: boolean;
  date: string;
  pumpId: string | null;
  /** Hours from midnight where the job's block starts. */
  startHour: number;
  destination: string;
  ignoreId?: string;
  /** Linked to the previous job: drive from it. Otherwise from the operator's yard, or the shop. */
  linked: boolean;
  /** The operator on the order, whose home yard is where an unlinked drive starts. */
  operatorId?: string;
  /** Called with Google's answer. The form decides whether to use it. */
  onEstimate: (minutes: number) => void;
}

/**
 * Asks Google how long the drive into this job takes, from the pump's previous job or the shop,
 * once the pump, time and address are known. If Google can't say, the status stays idle and the
 * dispatcher's own value stands.
 */
export function useDriveTime({ enabled, date, pumpId, startHour, destination, ignoreId, linked, operatorId, onEstimate }: UseDriveTimeOptions) {
  const [status, setStatus] = useState<DriveTimeStatus>({ state: 'idle' });
  const onEstimateRef = useRef(onEstimate);
  useEffect(() => {
    onEstimateRef.current = onEstimate;
  });

  const ready = enabled && Boolean(pumpId && UUID.test(pumpId)) && destination.trim().length >= 5 && Boolean(date);
  useEffect(() => {
    if (!ready || !pumpId) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setStatus({ state: 'loading' });
      const result = await getDriveTime({ date, pumpId, startHour, destination: destination.trim(), linked, ...(operatorId ? { operatorId } : {}), ...(ignoreId ? { ignoreId } : {}) });
      if (cancelled) return;
      if (result.ok && result.data.minutes !== null) {
        setStatus({ state: 'ready', from: result.data.from, yardName: result.data.yardName, minutes: result.data.minutes });
        onEstimateRef.current(result.data.minutes);
      } else {
        setStatus({ state: 'idle' });
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [ready, date, pumpId, startHour, destination, ignoreId, linked, operatorId]);

  return ready ? status : ({ state: 'idle' } as DriveTimeStatus);
}
