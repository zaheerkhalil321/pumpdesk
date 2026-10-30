import type { DayBlock } from '@/features/orders/types';

interface Slot {
  pumpId: string;
  startHour: number;
  durationHours: number;
  /** An order that is being moved or edited never conflicts with itself. */
  ignoreId?: string;
}

/**
 * The first order on the same pump whose time overlaps the slot, or null.
 * A conflict is a warning only: dispatchers often pencil in times while planning.
 */
export function findOverlap<T extends Pick<DayBlock, 'id' | 'pumpId' | 'startHour' | 'durationHours'>>(
  bookings: T[],
  slot: Slot,
): T | null {
  const end = slot.startHour + slot.durationHours;
  return (
    bookings.find(
      (b) =>
        b.pumpId === slot.pumpId &&
        b.id !== slot.ignoreId &&
        slot.startHour < b.startHour + b.durationHours &&
        b.startHour < end,
    ) ?? null
  );
}
