import type { DayBlock } from '@/features/orders/types';

/** Drive time from the shop, or from the pump's previous job, to a new job. */
export const DEFAULT_TRAVEL_MINUTES = 30;

type TravelBlock = Pick<DayBlock, 'id' | 'pumpId' | 'startHour' | 'durationHours'> & {
  /** Drive time into this job. */
  travelMinutes?: number;
  /** Only a linked job drives from the job before it. */
  linkedToPrevious?: boolean;
};

interface TravelSlot {
  pumpId: string;
  /** The whole block: prep before the pour through clean-up. */
  startHour: number;
  durationHours: number;
  /** Prep before the pour, in hours. Used to work out where the pour should move to. */
  prepHours: number;
  /** Drive time into this job. */
  travelMinutes: number;
  /** Linked to the job before it. Not linked means the crew starts from the shop, so nothing to check. */
  linked: boolean;
  ignoreId?: string;
}

export interface TravelClash<T extends TravelBlock> {
  /** previous: the job before this one runs too late. next: this job runs into the job after it. */
  kind: 'previous' | 'next';
  other: T;
  /** Minutes between the two jobs. Negative when they overlap. */
  gapMinutes: number;
  travelMinutes: number;
  /** For "previous": the earliest pour time that leaves enough travel time, in hours past midnight. */
  suggestedPourHour: number | null;
}

const QUARTER = 0.25;
const roundUpToQuarter = (hours: number) => Math.ceil(hours / QUARTER - 1e-9) * QUARTER;

/**
 * Checks the travel time between jobs on one pump: from the job before to this one,
 * and from this one to the job after it. Returns the first problem, or null.
 * A clash is a warning only: dispatchers can still keep the times they chose.
 */
export function findTravelClash<T extends TravelBlock>(bookings: T[], slot: TravelSlot): TravelClash<T> | null {
  const others = bookings
    .filter((b) => b.pumpId === slot.pumpId && b.id !== slot.ignoreId)
    .sort((a, b) => a.startHour - b.startHour);
  const slotEnd = slot.startHour + slot.durationHours;

  const previous = others.filter((b) => b.startHour <= slot.startHour).pop();
  if (previous && slot.linked) {
    const gapMinutes = Math.round((slot.startHour - (previous.startHour + previous.durationHours)) * 60);
    if (gapMinutes < slot.travelMinutes) {
      const earliestBlockStart = previous.startHour + previous.durationHours + slot.travelMinutes / 60;
      return {
        kind: 'previous',
        other: previous,
        gapMinutes,
        travelMinutes: slot.travelMinutes,
        suggestedPourHour: roundUpToQuarter(earliestBlockStart + slot.prepHours),
      };
    }
  }

  const next = others.find((b) => b.startHour > slot.startHour);
  if (next?.linkedToPrevious) {
    const travelMinutes = next.travelMinutes ?? 0;
    const gapMinutes = Math.round((next.startHour - slotEnd) * 60);
    if (gapMinutes < travelMinutes) {
      return { kind: 'next', other: next, gapMinutes, travelMinutes, suggestedPourHour: null };
    }
  }
  return null;
}


/** The job a pump drives from to reach a linked one: the latest one that starts before it, or null for the shop. */
export function previousBlock<T extends Pick<DayBlock, 'id' | 'pumpId' | 'startHour'>>(
  bookings: T[],
  pumpId: string,
  startHour: number,
  ignoreId?: string,
): T | null {
  return (
    bookings
      .filter((b) => b.pumpId === pumpId && b.id !== ignoreId && b.startHour <= startHour)
      .sort((a, b) => a.startHour - b.startHour)
      .pop() ?? null
  );
}
