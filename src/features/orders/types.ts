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
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
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
  status: 'Pending' | 'Confirmed' | 'Turned In' | 'Completed' | 'Cancelled';
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
