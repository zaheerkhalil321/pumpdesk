'use client';

import { useSyncExternalStore } from 'react';
import { ScheduleBooking } from '@/components/schedule/schedule-types';

export interface OrderItem {
  id: string;
  serviceDate: string;
  dateTimestamp: number;
  pourTime: string;
  customer: string;
  jobSite: string;
  pump: string;
  pumpModel: string;
  operator: string;
  isUnassigned?: boolean;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  invoiceStatus: 'Not created' | 'Create invoice' | 'Paid';
}

export interface FullOrderData {
  id: string;
  customer: string;
  customerPhone: string;
  customerContact: string;
  jobName: string;
  status: 'Pending' | 'Confirmed' | 'Turned In' | 'Completed' | 'Cancelled';
  pourType: string;
  locationCity: string;
  serviceDate: string;
  arriveBy: string;
  pourTime: string;
  estimatedEnd: string;
  volumeYards: number;
  jobSiteAddress: string;
  jobSiteCityZip: string;
  directionsUrl: string;
  pumpRequested: string;
  purchaseOrder: string;
  siteInstructions: string;
  assignedPumpCode: string;
  assignedPumpType: string;
  assignedOperator: string;
  operatorPhone: string;
  workTicketNumber: string;
  workTicketStatus: string;
  invoiceStatus: string;
  collectOnDelivery: boolean;
  notifyOperator: boolean;
  adjustedYards: number;
  adjustedTravel: number;
  adjustedPrep: number;
  adjustedPour: number;
  adjustedCleanup: number;
}

export const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'ORD-1525',
    serviceDate: 'Sep 18, 2026',
    dateTimestamp: 1789718400000,
    pourTime: '8:00 AM',
    customer: 'Coastal Foundations',
    jobSite: '18 Main Street, Rockland',
    pump: 'Unassigned',
    pumpModel: 'Unassigned',
    operator: 'Operator needed',
    isUnassigned: true,
    status: 'Pending',
    invoiceStatus: 'Not created',
  },
  {
    id: 'ORD-1524',
    serviceDate: 'Sep 17, 2026',
    dateTimestamp: 1789632000000,
    pourTime: '7:00 AM',
    customer: 'Pine Tree Concrete',
    jobSite: '42 Union Street, Camden',
    pump: '02 · 28M',
    pumpModel: '28M',
    operator: 'Rob Black',
    status: 'Confirmed',
    invoiceStatus: 'Not created',
  },
  {
    id: 'ORD-1523',
    serviceDate: 'Sep 16, 2026',
    dateTimestamp: 1789545600000,
    pourTime: '9:30 AM',
    customer: 'Harbor Builders',
    jobSite: '9 Water Street, Belfast',
    pump: '01 · 34M',
    pumpModel: '34M',
    operator: 'Dave Smith',
    status: 'Confirmed',
    invoiceStatus: 'Not created',
  },
  {
    id: 'ORD-1522',
    serviceDate: 'Sep 15, 2026',
    dateTimestamp: 1789459200000,
    pourTime: '7:30 AM',
    customer: 'Accurate Concrete',
    jobSite: '61 Elm Street, Rockport',
    pump: '02 · 28M',
    pumpModel: '28M',
    operator: 'Rob Black',
    status: 'Confirmed',
    invoiceStatus: 'Not created',
  },
  {
    id: 'ORD-1521',
    serviceDate: 'Sep 14, 2026',
    dateTimestamp: 1789372800000,
    pourTime: '10:00 AM',
    customer: 'Granite State Builders',
    jobSite: '12 Knox Street, Thomaston',
    pump: '03 · 47M',
    pumpModel: '47M',
    operator: 'Dave Smith',
    status: 'Pending',
    invoiceStatus: 'Not created',
  },
  {
    id: 'ORD-1520',
    serviceDate: 'Sep 13, 2026',
    dateTimestamp: 1789286400000,
    pourTime: '8:00 AM',
    customer: 'Harbor Builders',
    jobSite: '27 Bay Road, Camden',
    pump: '01 · 34M',
    pumpModel: '34M',
    operator: 'Rob Black',
    status: 'Cancelled',
    invoiceStatus: 'Not created',
  },
  {
    id: 'ORD-1518',
    serviceDate: 'Sep 12, 2026',
    dateTimestamp: 1789200000000,
    pourTime: '7:30 AM',
    customer: 'Turner Construction',
    jobSite: '24 Bay View Street, Camden',
    pump: '01 · 34M',
    pumpModel: '34M',
    operator: 'Rob Black',
    status: 'Completed',
    invoiceStatus: 'Create invoice',
  },
  {
    id: 'ORD-1517',
    serviceDate: 'Sep 11, 2026',
    dateTimestamp: 1789113600000,
    pourTime: '8:00 AM',
    customer: 'Coastal Foundations',
    jobSite: '8 School Street, Waldoboro',
    pump: '04 · Line pump',
    pumpModel: 'Line pump',
    operator: 'Tony Perez',
    status: 'Completed',
    invoiceStatus: 'Paid',
  },
  {
    id: 'ORD-1516',
    serviceDate: 'Sep 10, 2026',
    dateTimestamp: 1789027200000,
    pourTime: '7:00 AM',
    customer: 'Midcoast Precast',
    jobSite: '15 Industrial Park, Rockland',
    pump: '02 · 28M',
    pumpModel: '28M',
    operator: 'Rob Black',
    status: 'Confirmed',
    invoiceStatus: 'Not created',
  },
  {
    id: 'ORD-1515',
    serviceDate: 'Sep 09, 2026',
    dateTimestamp: 1788940800000,
    pourTime: '8:30 AM',
    customer: 'Harbor Builders',
    jobSite: '44 Atlantic Ave, Boothbay',
    pump: 'Unassigned',
    pumpModel: 'Unassigned',
    operator: 'Operator needed',
    isUnassigned: true,
    status: 'Pending',
    invoiceStatus: 'Not created',
  },
  {
    id: 'ORD-1514',
    serviceDate: 'Sep 08, 2026',
    dateTimestamp: 1788854400000,
    pourTime: '6:30 AM',
    customer: 'Accurate Concrete',
    jobSite: '100 Commercial St, Rockport',
    pump: '03 · 47M',
    pumpModel: '47M',
    operator: 'Dave Smith',
    status: 'Completed',
    invoiceStatus: 'Paid',
  },
  {
    id: 'ORD-1513',
    serviceDate: 'Sep 05, 2026',
    dateTimestamp: 1788595200000,
    pourTime: '9:00 AM',
    customer: 'Granite State Builders',
    jobSite: '5 Route 1, Thomaston',
    pump: '01 · 34M',
    pumpModel: '34M',
    operator: 'Tony Perez',
    status: 'Completed',
    invoiceStatus: 'Paid',
  },
];

export const INITIAL_UNASSIGNED_JOBS: ScheduleBooking[] = [
  {
    id: 'unassigned-1',
    orderNumber: 'ORD-1501',
    pumpId: '',
    customerName: 'Pine Tree Concrete',
    jobSiteName: 'Rockport',
    startHour: 10,
    durationHours: 3,
    volumeYards: 95,
    status: 'travel',
  },
  {
    id: 'unassigned-2',
    orderNumber: 'ORD-1502',
    pumpId: '',
    customerName: 'Coastal Foundations',
    jobSiteName: 'Waldoboro',
    startHour: 13,
    durationHours: 3,
    volumeYards: 140,
    status: 'travel',
  },
];

export const INITIAL_SCHEDULE_BOOKINGS: ScheduleBooking[] = [
  {
    id: 'booking-seed-1',
    orderNumber: 'ORD-1518',
    pumpId: '01-34m',
    customerName: 'Turner Construction',
    jobSiteName: '24 Bay View Street, Camden',
    address: '24 Bay View Street, Camden',
    startHour: 7.5,
    durationHours: 3.5,
    volumeYards: 80,
    status: 'onsite',
    notes: 'Use the north gate. Washout area beside the gravel pad.',
  },
  {
    id: 'booking-seed-2',
    orderNumber: 'ORD-1524',
    pumpId: '02-28m',
    customerName: 'Pine Tree Concrete',
    jobSiteName: '42 Union Street, Camden',
    address: '42 Union Street, Camden',
    startHour: 7.0,
    durationHours: 4.0,
    volumeYards: 65,
    status: 'travel',
  },
  {
    id: 'booking-seed-3',
    orderNumber: 'ORD-1521',
    pumpId: '03-47m',
    customerName: 'Granite State Builders',
    jobSiteName: '12 Knox Street, Thomaston',
    address: '12 Knox Street, Thomaston',
    startHour: 10.0,
    durationHours: 4.5,
    volumeYards: 120,
    status: 'travel',
  },
];

const STORAGE_KEYS = {
  ORDERS: 'pumpdesk_orders_v1',
  BOOKINGS: 'pumpdesk_bookings_v1',
  UNASSIGNED: 'pumpdesk_unassigned_v1',
  DETAILS: 'pumpdesk_order_details_v1',
};

// ── Broadcast change event across components in the same window
function broadcastChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pumpdesk_storage_sync'));
  }
}

// ── Orders Operations ──
export function getStoredOrders(): OrderItem[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ORDERS;
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveStoredOrders(orders: OrderItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    broadcastChange();
  } catch (e) {
    console.error('Failed to save orders to localStorage', e);
  }
}

export function addOrUpdateOrder(order: OrderItem, fullDetails?: Partial<FullOrderData>): void {
  const currentOrders = getStoredOrders();
  const index = currentOrders.findIndex((o) => o.id === order.id);
  let updatedOrders: OrderItem[];

  if (index >= 0) {
    updatedOrders = [...currentOrders];
    updatedOrders[index] = { ...updatedOrders[index], ...order };
  } else {
    updatedOrders = [order, ...currentOrders];
  }

  saveStoredOrders(updatedOrders);

  if (fullDetails && typeof window !== 'undefined') {
    try {
      const rawDetails = localStorage.getItem(STORAGE_KEYS.DETAILS);
      const detailsMap: Record<string, Partial<FullOrderData>> = rawDetails ? JSON.parse(rawDetails) : {};
      detailsMap[order.id] = { ...detailsMap[order.id], ...fullDetails, id: order.id };
      localStorage.setItem(STORAGE_KEYS.DETAILS, JSON.stringify(detailsMap));
    } catch (e) {
      console.error('Failed to save full order details', e);
    }
  }
}

// ── Bookings Operations ──
export function getStoredBookings(): ScheduleBooking[] {
  if (typeof window === 'undefined') return INITIAL_SCHEDULE_BOOKINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_SCHEDULE_BOOKINGS));
      return INITIAL_SCHEDULE_BOOKINGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SCHEDULE_BOOKINGS;
  } catch {
    return INITIAL_SCHEDULE_BOOKINGS;
  }
}

export function saveStoredBookings(bookings: ScheduleBooking[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    broadcastChange();
  } catch (e) {
    console.error('Failed to save bookings to localStorage', e);
  }
}

export function addOrUpdateBooking(booking: ScheduleBooking): void {
  const current = getStoredBookings();
  const index = current.findIndex((b) => b.id === booking.id || (b.orderNumber && b.orderNumber === booking.orderNumber));
  let updated: ScheduleBooking[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...booking };
  } else {
    updated = [...current, booking];
  }

  saveStoredBookings(updated);

  // Sync to unassigned if pumpId removed, or remove from unassigned if pump assigned
  const unassigned = getStoredUnassignedJobs();
  if (booking.pumpId) {
    const filteredUnassigned = unassigned.filter((u) => u.id !== booking.id && u.orderNumber !== booking.orderNumber);
    if (filteredUnassigned.length !== unassigned.length) {
      saveStoredUnassignedJobs(filteredUnassigned);
    }
  }

  // Also sync summary to Orders table
  syncBookingToOrders(booking);
}

export function deleteStoredBooking(bookingId: string): void {
  const current = getStoredBookings();
  const updated = current.filter((b) => b.id !== bookingId);
  saveStoredBookings(updated);

  const unassigned = getStoredUnassignedJobs();
  const updatedUnassigned = unassigned.filter((u) => u.id !== bookingId);
  saveStoredUnassignedJobs(updatedUnassigned);
}

// ── Unassigned Jobs Operations ──
export function getStoredUnassignedJobs(): ScheduleBooking[] {
  if (typeof window === 'undefined') return INITIAL_UNASSIGNED_JOBS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNASSIGNED);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.UNASSIGNED, JSON.stringify(INITIAL_UNASSIGNED_JOBS));
      return INITIAL_UNASSIGNED_JOBS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_UNASSIGNED_JOBS;
  } catch {
    return INITIAL_UNASSIGNED_JOBS;
  }
}

export function saveStoredUnassignedJobs(jobs: ScheduleBooking[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.UNASSIGNED, JSON.stringify(jobs));
    broadcastChange();
  } catch (e) {
    console.error('Failed to save unassigned jobs', e);
  }
}

export function addOrUpdateUnassignedJob(job: ScheduleBooking): void {
  const current = getStoredUnassignedJobs();
  const index = current.findIndex((j) => j.id === job.id || (j.orderNumber && j.orderNumber === job.orderNumber));
  let updated: ScheduleBooking[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...job };
  } else {
    updated = [job, ...current];
  }

  saveStoredUnassignedJobs(updated);
  syncBookingToOrders(job);
}

// ── Helpers ──
function syncBookingToOrders(booking: ScheduleBooking) {
  const hourInt = Math.floor(booking.startHour);
  const minutes = Math.round((booking.startHour - hourInt) * 60);
  const ampm = hourInt >= 12 ? 'PM' : 'AM';
  const displayHour = hourInt > 12 ? hourInt - 12 : hourInt === 0 ? 12 : hourInt;
  const timeStr = `${displayHour}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;

  const pumpMap: Record<string, { code: string; model: string; operator: string }> = {
    '01-34m': { code: '01 · 34M', model: '34M', operator: 'Rob Black' },
    '02-28m': { code: '02 · 28M', model: '28M', operator: 'Rob Black' },
    '03-47m': { code: '03 · 47M', model: '47M', operator: 'Dave Smith' },
    '04-line-pump': { code: '04 · Line pump', model: 'Line pump', operator: 'Tony Perez' },
    '04-line': { code: '04 · Line pump', model: 'Line pump', operator: 'Tony Perez' },
  };

  const pumpInfo = booking.pumpId ? pumpMap[booking.pumpId] : null;

  const orderItem: OrderItem = {
    id: booking.orderNumber || `ORD-${Date.now().toString().slice(-4)}`,
    serviceDate: 'Sep 12, 2026',
    dateTimestamp: Date.now(),
    pourTime: timeStr,
    customer: booking.customerName || 'Customer',
    jobSite: booking.jobSiteName || 'Job Site',
    pump: pumpInfo ? pumpInfo.code : 'Unassigned',
    pumpModel: pumpInfo ? pumpInfo.model : 'Unassigned',
    operator: pumpInfo ? pumpInfo.operator : 'Operator needed',
    isUnassigned: !booking.pumpId,
    status: booking.pumpId ? 'Confirmed' : 'Pending',
    invoiceStatus: 'Not created',
  };

  const orders = getStoredOrders();
  const existingIdx = orders.findIndex((o) => o.id === orderItem.id);
  if (existingIdx >= 0) {
    orders[existingIdx] = { ...orders[existingIdx], ...orderItem };
    saveStoredOrders(orders);
  } else {
    saveStoredOrders([orderItem, ...orders]);
  }
}

export function generateNextOrderNumber(): string {
  const orders = getStoredOrders();
  let maxNum = 1525;
  for (const o of orders) {
    const match = o.id.match(/ORD-(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `ORD-${maxNum + 1}`;
}

export function getFullOrderDetail(orderId: string): Partial<FullOrderData> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DETAILS);
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[orderId] || null;
  } catch {
    return null;
  }
}

// ── Reactive hooks with SSR safe hydration (0 cascading renders) ──
function subscribeToStorage(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('pumpdesk_storage_sync', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('pumpdesk_storage_sync', callback);
    window.removeEventListener('storage', callback);
  };
}

let cachedOrdersRaw = '';
let cachedOrders: OrderItem[] = INITIAL_ORDERS;

function getOrdersClientSnapshot(): OrderItem[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) return INITIAL_ORDERS;
    if (raw !== cachedOrdersRaw) {
      cachedOrdersRaw = raw;
      const parsed = JSON.parse(raw);
      cachedOrders = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_ORDERS;
    }
    return cachedOrders;
  } catch {
    return INITIAL_ORDERS;
  }
}

function getOrdersServerSnapshot(): OrderItem[] {
  return INITIAL_ORDERS;
}

export function useOrders(): OrderItem[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getOrdersClientSnapshot,
    getOrdersServerSnapshot
  );
}

let cachedBookingsRaw = '';
let cachedBookings: ScheduleBooking[] = INITIAL_SCHEDULE_BOOKINGS;

function getBookingsClientSnapshot(): ScheduleBooking[] {
  if (typeof window === 'undefined') return INITIAL_SCHEDULE_BOOKINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (!raw) return INITIAL_SCHEDULE_BOOKINGS;
    if (raw !== cachedBookingsRaw) {
      cachedBookingsRaw = raw;
      const parsed = JSON.parse(raw);
      cachedBookings = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SCHEDULE_BOOKINGS;
    }
    return cachedBookings;
  } catch {
    return INITIAL_SCHEDULE_BOOKINGS;
  }
}

function getBookingsServerSnapshot(): ScheduleBooking[] {
  return INITIAL_SCHEDULE_BOOKINGS;
}

export function useBookings(): ScheduleBooking[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getBookingsClientSnapshot,
    getBookingsServerSnapshot
  );
}

let cachedUnassignedRaw = '';
let cachedUnassigned: ScheduleBooking[] = INITIAL_UNASSIGNED_JOBS;

function getUnassignedClientSnapshot(): ScheduleBooking[] {
  if (typeof window === 'undefined') return INITIAL_UNASSIGNED_JOBS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.UNASSIGNED);
    if (!raw) return INITIAL_UNASSIGNED_JOBS;
    if (raw !== cachedUnassignedRaw) {
      cachedUnassignedRaw = raw;
      const parsed = JSON.parse(raw);
      cachedUnassigned = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_UNASSIGNED_JOBS;
    }
    return cachedUnassigned;
  } catch {
    return INITIAL_UNASSIGNED_JOBS;
  }
}

function getUnassignedServerSnapshot(): ScheduleBooking[] {
  return INITIAL_UNASSIGNED_JOBS;
}

export function useUnassignedJobs(): ScheduleBooking[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getUnassignedClientSnapshot,
    getUnassignedServerSnapshot
  );
}
