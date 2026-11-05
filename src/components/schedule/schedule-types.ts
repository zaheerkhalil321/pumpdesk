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
  /** The whole block on the board: prep before the pour through clean-up. e.g. 6.5 for 6:30 AM. */
  startHour: number;
  durationHours: number; // e.g. 3.5
  /** When the pour itself starts and how long it takes (prep and clean-up not included). */
  pourHour: number;
  pourHours: number;
  /** Drive time into this job, from the shop or the pump's previous job. */
  travelMinutes: number;
  /** The crew drives straight from the previous job on the pump, not from the shop. */
  linkedToPrevious: boolean;
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
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
}

export interface ScheduleFilters {
  searchQuery: string;
  selectedPumpId: string;
  selectedOperator: string;
  viewMode: ScheduleViewMode;
}
