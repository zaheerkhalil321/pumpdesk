/** View models the fleet and crew screens render. Mappers turn database rows into these. */

export type EquipmentType = 'all' | 'boom_pump' | 'line_pump';
export type EquipmentStatus = 'all' | 'available' | 'maintenance';

export interface DefaultOperatorInfo {
  id: string;
  name: string;
  role: string;
  badge?: string | null;
}

export interface TodayAvailability {
  /** "booked" is filled in once booking exists (Step 3). */
  type: 'booked' | 'available' | 'maintenance';
  label: string;
}

export interface NextInspectionInfo {
  /** Display text, e.g. "Nov 12, 2026". Empty when no date is set. */
  date: string;
  /** ISO date (yyyy-mm-dd) for form inputs. Empty when no date is set. */
  iso: string;
  dueSoon?: boolean;
}

export interface PumpItem {
  id: string;
  unitNumber: string;
  make: string;
  model: string;
  type: 'boom_pump' | 'line_pump';
  typeLabel: string;
  boomSize?: number;
  horizontalReach?: number;
  boomLength: string;
  defaultOperator: DefaultOperatorInfo;
  todayStatus: TodayAvailability;
  nextInspection: NextInspectionInfo;
  status: 'available' | 'maintenance';
  hourlyRate: number | string;
  minHours: string | number;
  inMaintenance: boolean;
  maintenanceNote?: string;
  year?: string;
}

export interface OperatorEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface OperatorItem {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  email: string;
  branch: string;
  branchId: string | null;
  defaultPump?: string;
  todayStatus: {
    type: 'assigned' | 'available' | 'time_off';
    label: string;
  };
  status: 'Active' | 'Inactive';
  emergencyContact: OperatorEmergencyContact;
  emergencyContacts?: OperatorEmergencyContact[];
  cdlExpiresOn: string;
  medicalCertExpiresOn: string;
  credentialAlert?: {
    title: string;
    date: string;
    daysRemaining: number;
  } | null;
}

/** One expiring (or expired) operator credential, shown on the schedule page. */
export interface CredentialAlertItem {
  operatorId: string;
  operatorName: string;
  title: string;
  date: string;
  daysRemaining: number;
}

export interface BranchOption {
  value: string;
  label: string;
}
