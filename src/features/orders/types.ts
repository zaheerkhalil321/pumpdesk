import type { OrderFormSupplier } from '@/features/suppliers/types';
import type { OrderStatus } from '@/features/orders/statuses';

/** Real records the New order and quick-booking forms offer in their dropdowns. */

export interface OrderFormContact {
  id: string;
  name: string;
  /** Job title, e.g. "Superintendent". Empty when not set. */
  role: string;
  phone: string;
}

export interface OrderFormSite {
  id: string;
  /** What the picker shows, e.g. "Rockland Medical Plaza · Rockland, ME". */
  label: string;
  /** Text copied into the job site field. */
  address: string;
}

export interface OrderFormCustomer {
  id: string;
  name: string;
  contacts: OrderFormContact[];
  sites: OrderFormSite[];
}

export interface OrderFormPump {
  id: string;
  /** Short code, e.g. "01 · 34M". */
  code: string;
  /** Picker label, e.g. "01 · 34M Putzmeister". */
  label: string;
  /** Size group used for "minimum pump size", e.g. "34 m" or "Line pump". */
  sizeLabel: string;
  model: string;
  boomLength: string;
  /** Hourly rate set on the pump, e.g. "$195 / hr". Empty when no rate is set. */
  hourlyRate: string;
  defaultOperatorId: string | null;
  defaultOperatorName: string;
}

export interface OrderFormOperator {
  id: string;
  name: string;
  phone: string;
}

export interface OrderFormOptions {
  customers: OrderFormCustomer[];
  pumps: OrderFormPump[];
  operators: OrderFormOperator[];
  suppliers: OrderFormSupplier[];
}

/** Orders on each day, keyed by yyyy-MM-dd. Days with no orders are left out. */
export type DayCounts = Record<string, { total: number; pending: number }>;

/** One pour on a pump, just enough to tell whether a new pour would overlap it. */
export interface DayBlock {
  id: string;
  pumpId: string;
  /** Hours from midnight, e.g. 7.5 for 7:30 AM. */
  startHour: number;
  durationHours: number;
  customerName: string;
  orderNumber: string;
}

/** An open job an operator is on, listed before they are deleted. */
export interface OperatorJob {
  id: string;
  jobNumber: string;
  customerName: string;
  /** "Thu, Oct 29" */
  dateLabel: string;
  /** "7:00 AM" */
  timeLabel: string;
  /** Empty until a pump is assigned. */
  pumpCode: string;
  /** Already sent to the operator, so they will need telling again. */
  dispatched: boolean;
  isAdditionalOperator: boolean;
}

/** Numbers shown on the sidebar links. */
export interface NavCounts {
  /** Pours scheduled for today. */
  today: number;
  /** Orders that are not cancelled and not in the past. */
  orders: number;
}

/** One row of the Orders list. */
export interface OrderItem {
  /** Order number, e.g. "ORD-1001". It is also what the order page URL uses. */
  id: string;
  /** Database id of the order. */
  jobId: string;
  serviceDate: string;
  dateTimestamp: number;
  pourTime: string;
  customer: string;
  jobSite: string;
  pump: string;
  pumpModel: string;
  operator: string;
  /** The operator's phone, or empty when they have none. */
  operatorPhone: string;
  isUnassigned?: boolean;
  status: OrderStatus;
  invoiceStatus: 'Not created' | 'Create invoice' | 'Paid';
  volumeYards?: number;
}

/** Everything the order page shows and edits. */
export interface FullOrderData {
  id: string;
  jobId: string;
  version: number;
  customerId: string;
  contactId: string | null;
  pumpId: string | null;
  operatorId: string | null;
  secondOperatorId: string | null;
  secondOperatorName: string;
  maxPumpSize: string;
  supplierName: string;
  linesOnSite: boolean;
  customerNotes: string;
  internalNote: string;
  billingService: string;
  extraItems: { name: string; quantity: number }[];
  dispatchStatus: 'unassigned' | 'assigned' | 'dispatched' | 'acknowledged';
  customer: string;
  customerPhone: string;
  customerContact: string;
  jobName: string;
  status: OrderStatus;
  pourType: string;
  locationCity: string;
  serviceDate: string;
  /** Pour date as yyyy-MM-dd, for the date picker and for saving. */
  serviceDateIso: string;
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
