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

export interface ScheduleBooking {
  id: string;
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
}

export interface ScheduleFilters {
  searchQuery: string;
  selectedPumpId: string;
  selectedOperator: string;
  viewMode: ScheduleViewMode;
}
