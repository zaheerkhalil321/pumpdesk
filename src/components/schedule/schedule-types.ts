export type BookingStatus = "travel" | "onsite" | "washout";

export type ScheduleViewMode = "day" | "week" | "list";

export interface PumpLane {
  id: string;
  code: string;
  name: string;
  boomLength: string;
  operator: string | null;
  status: "active" | "standby" | "maintenance";
}

export type DispatchStatus = "unassigned" | "draft" | "dispatched";

export interface ScheduleBooking {
  id: string;
  /** Database id and version of the order, used to save changes. */
  jobId?: string;
  version?: number;
  orderNumber: string;
  pumpId: string;
  customerName: string;
  jobSiteName: string;
  address?: string;
  startHour: number; // e.g. 7.0 for 7:00 AM
  durationHours: number; // e.g. 4.0
  volumeYards: number;
  status: BookingStatus;
  notes?: string;
  operator?: string | null;
  dispatchStatus?: DispatchStatus;
  dispatchedAt?: string;
  pourType?: string;
  /** Pump label saved with the booking, e.g. "01 · 34M". Empty until a pump is assigned. */
  pumpCode?: string;
  /** Pump make and model, e.g. "Putzmeister 34Z". */
  pumpModel?: string;
  /** Pour date as yyyy-MM-dd. */
  serviceDate?: string;
  supplierName?: string;
  minPumpSize?: string;
  /** Real arrival and pour times, e.g. "6:00 AM". */
  arriveByLabel?: string;
  pourTimeLabel?: string;
  /** The job contact saved with the order. */
  contactName?: string;
  contactPhone?: string;
}

export interface ScheduleFilters {
  searchQuery: string;
  selectedPumpId: string;
  selectedOperator: string;
  viewMode: ScheduleViewMode;
}
