import type { Database } from '@/types/database.types';

type BookingStatus = Database['public']['Enums']['booking_status'];

/** The order statuses people see, in the order they are offered. */
export const ORDER_STATUSES = [
  'Pending',
  'Inspection Pending',
  'Confirmed',
  'Turned In',
  'Reviewed',
  'Cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses a person can pick on an order. Cancelling has its own action. */
export const EDITABLE_ORDER_STATUSES = ['Pending', 'Inspection Pending', 'Confirmed', 'Turned In', 'Reviewed'] as const;
export type EditableOrderStatus = (typeof EDITABLE_ORDER_STATUSES)[number];

const BOOKING_BY_STATUS: Record<EditableOrderStatus, BookingStatus> = {
  Pending: 'pending',
  'Inspection Pending': 'inspection_pending',
  Confirmed: 'confirmed',
  'Turned In': 'turned_in',
  Reviewed: 'reviewed',
};

const STATUS_BY_BOOKING: Partial<Record<BookingStatus, OrderStatus>> = {
  pending: 'Pending',
  inspection_pending: 'Inspection Pending',
  confirmed: 'Confirmed',
  turned_in: 'Turned In',
  reviewed: 'Reviewed',
  cancelled: 'Cancelled',
};

export function toBookingStatus(status: EditableOrderStatus): BookingStatus {
  return BOOKING_BY_STATUS[status];
}

export function toOrderStatus(booking: BookingStatus): OrderStatus {
  return STATUS_BY_BOOKING[booking] ?? 'Pending';
}

/** Badge, dot and filter-tab colours for each status. */
export const ORDER_STATUS_STYLE: Record<OrderStatus, { badge: string; dot: string }> = {
  Pending: { badge: 'bg-amber-50 text-amber-800 border-amber-200/80', dot: 'bg-amber-500' },
  'Inspection Pending': { badge: 'bg-orange-50 text-orange-800 border-orange-200/80', dot: 'bg-orange-500' },
  Confirmed: { badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80', dot: 'bg-emerald-500' },
  'Turned In': { badge: 'bg-sky-50 text-sky-800 border-sky-200/80', dot: 'bg-sky-500' },
  Reviewed: { badge: 'bg-indigo-50 text-indigo-800 border-indigo-200/80', dot: 'bg-indigo-500' },
  Cancelled: { badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};
