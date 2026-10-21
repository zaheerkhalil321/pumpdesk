import { formatInTimeZone } from 'date-fns-tz';

import type { Tables } from '@/types/database.types';
import { formatE164 } from '@/lib/phone';
import type { BranchOption, OperatorItem, PumpItem } from '@/features/fleet/types';

export const EQUIPMENT_COLUMNS =
  'id, branch_id, equipment_number, type, status, make, model, model_year, boom_length_m, horizontal_reach_ft, hourly_rate_override, min_hours_override, default_operator_id, next_inspection_due, notes';
export const EMPLOYEE_COLUMNS =
  'id, branch_id, first_name, last_name, email, phone, status, is_operator, job_title, cdl_expires_on, medical_cert_expires_on';

export type EquipmentRow = Pick<
  Tables<'equipment'>,
  | 'id'
  | 'branch_id'
  | 'equipment_number'
  | 'type'
  | 'status'
  | 'make'
  | 'model'
  | 'model_year'
  | 'boom_length_m'
  | 'horizontal_reach_ft'
  | 'hourly_rate_override'
  | 'min_hours_override'
  | 'default_operator_id'
  | 'next_inspection_due'
  | 'notes'
>;
export type EmployeeRow = Pick<
  Tables<'employees'>,
  | 'id'
  | 'branch_id'
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone'
  | 'status'
  | 'is_operator'
  | 'job_title'
  | 'cdl_expires_on'
  | 'medical_cert_expires_on'
>;

const DUE_SOON_DAYS = 14;
const CREDENTIAL_ALERT_DAYS = 60;
const NOT_PROVIDED = { name: 'Not provided', relationship: 'Not provided', phone: 'Not provided' };

/** Whole days from `today` to `isoDate`; both are yyyy-mm-dd. Negative when `isoDate` is past. */
export function daysUntil(isoDate: string, today: string): number {
  const toUtc = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((toUtc(isoDate) - toUtc(today)) / 86_400_000);
}

/** Today's date (yyyy-mm-dd) in the company timezone. */
export function todayIn(timezone: string, now: Date = new Date()): string {
  return formatInTimeZone(now, timezone, 'yyyy-MM-dd');
}

function formatDateOnly(isoDate: string): string {
  return formatInTimeZone(`${isoDate}T12:00:00Z`, 'UTC', 'MMM d, yyyy');
}

export function fullName(person: { first_name: string; last_name: string }): string {
  return `${person.first_name} ${person.last_name}`.trim();
}

export function mapOperator(
  row: EmployeeRow,
  branchesById: Map<string, string>,
  defaultPumpLabel: string | undefined,
  today: string,
): OperatorItem {
  const alerts: { title: string; date: string; daysRemaining: number }[] = [];
  const addAlert = (label: string, iso: string | null) => {
    if (!iso) return;
    const days = daysUntil(iso, today);
    if (days > CREDENTIAL_ALERT_DAYS) return;
    alerts.push({
      title:
        days >= 0
          ? `${label} expires in ${days} ${days === 1 ? 'day' : 'days'}`
          : `${label} expired ${-days} ${days === -1 ? 'day' : 'days'} ago`,
      date: formatDateOnly(iso),
      daysRemaining: days,
    });
  };
  addAlert('CDL', row.cdl_expires_on);
  addAlert('Medical Examiner Cert', row.medical_cert_expires_on);
  alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return {
    id: row.id,
    name: fullName(row),
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.job_title ?? 'Operator',
    phone: formatE164(row.phone),
    email: row.email ?? '',
    branch: row.branch_id ? (branchesById.get(row.branch_id) ?? '') : '',
    branchId: row.branch_id,
    defaultPump: defaultPumpLabel ?? 'None',
    todayStatus: { type: 'available', label: 'Available' },
    status: row.status === 'active' ? 'Active' : 'Inactive',
    emergencyContact: NOT_PROVIDED,
    emergencyContacts: [],
    cdlExpiresOn: row.cdl_expires_on ?? '',
    medicalCertExpiresOn: row.medical_cert_expires_on ?? '',
    credentialAlert: alerts[0] ?? null,
  };
}

export function mapPump(
  row: EquipmentRow,
  operatorsById: Map<string, EmployeeRow>,
  today: string,
): PumpItem {
  const isBoom = row.type !== 'line_pump' && row.type !== 'trailer_pump';
  const boomSize = row.boom_length_m ? Number(row.boom_length_m) : undefined;
  const reach = row.horizontal_reach_ft ? Number(row.horizontal_reach_ft) : undefined;
  const operator = row.default_operator_id ? operatorsById.get(row.default_operator_id) : undefined;
  const inMaintenance = row.status !== 'available';

  const typeLabel = isBoom ? (boomSize ? `Boom pump · ${boomSize}M` : 'Boom pump') : 'Line pump';
  const boomLength = isBoom
    ? boomSize
      ? `${boomSize}M${reach ? ` (${reach} ft)` : ''}`
      : 'Boom pump'
    : reach
      ? `Ground Line (${reach}ft)`
      : 'Line pump';

  const inspectionIso = row.next_inspection_due ?? '';

  return {
    id: row.id,
    unitNumber: row.equipment_number,
    make: row.make ?? '',
    model: row.model ?? '',
    type: isBoom ? 'boom_pump' : 'line_pump',
    typeLabel,
    boomSize,
    horizontalReach: reach,
    boomLength,
    defaultOperator: operator
      ? { id: operator.id, name: fullName(operator), role: operator.job_title ?? 'Operator', badge: null }
      : { id: 'unassigned', name: 'Unassigned', role: 'None', badge: null },
    todayStatus: inMaintenance
      ? { type: 'maintenance', label: 'Maintenance · Unavailable' }
      : { type: 'available', label: operator ? 'Available · Yard ready' : 'Available · Assign operator' },
    nextInspection: {
      date: inspectionIso ? formatDateOnly(inspectionIso) : 'Not set',
      iso: inspectionIso,
      dueSoon: inspectionIso ? daysUntil(inspectionIso, today) <= DUE_SOON_DAYS : false,
    },
    status: inMaintenance ? 'maintenance' : 'available',
    hourlyRate: row.hourly_rate_override === null ? '' : Number(row.hourly_rate_override),
    minHours: row.min_hours_override === null ? 4 : Number(row.min_hours_override),
    inMaintenance,
    maintenanceNote: inMaintenance ? (row.notes ?? undefined) : undefined,
    year: row.model_year ? String(row.model_year) : undefined,
  };
}

export function toBranchOptions(branches: { id: string; name: string }[]): BranchOption[] {
  return branches.map((b) => ({ value: b.id, label: b.name }));
}
