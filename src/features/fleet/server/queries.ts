import 'server-only';

import { z } from 'zod';

import { createClient } from '@/server/supabase';
import { requireSession } from '@/server/session';
import { getPumpDisplayName } from '@/features/fleet/format';
import {
  credentialAlertsFor,
  EMPLOYEE_COLUMNS,
  fullName,
  EQUIPMENT_COLUMNS,
  mapOperator,
  mapPump,
  todayIn,
  toBranchOptions,
  type EmployeeRow,
  type EquipmentRow,
} from '@/features/fleet/mappers';
import type { BranchOption, CredentialAlertItem, OperatorItem, PumpItem } from '@/features/fleet/types';

// All reads go through the user-scoped client, so RLS applies. Explicit column lists only.

const isUuid = (value: string) => z.string().uuid().safeParse(value).success;

async function loadFleet() {
  const session = await requireSession();
  const supabase = await createClient();
  const [equipment, employees, branches] = await Promise.all([
    supabase.from('equipment').select(EQUIPMENT_COLUMNS).eq('is_active', true).order('equipment_number'),
    supabase.from('employees').select(EMPLOYEE_COLUMNS).eq('is_operator', true).order('first_name'),
    supabase.from('branches').select('id, name').eq('is_active', true).order('name'),
  ]);
  if (equipment.error) throw equipment.error;
  if (employees.error) throw employees.error;
  return {
    today: todayIn(session.timezone),
    equipment: (equipment.data ?? []) as EquipmentRow[],
    employees: (employees.data ?? []) as EmployeeRow[],
    branches: branches.data ?? [],
  };
}

function buildOperators(fleet: Awaited<ReturnType<typeof loadFleet>>): OperatorItem[] {
  const branchesById = new Map(fleet.branches.map((b) => [b.id, b.name]));
  const operatorsById = new Map(fleet.employees.map((e) => [e.id, e]));
  const pumpLabelByOperator = new Map<string, string>();
  for (const row of fleet.equipment) {
    if (!row.default_operator_id || pumpLabelByOperator.has(row.default_operator_id)) continue;
    pumpLabelByOperator.set(row.default_operator_id, getPumpDisplayName(mapPump(row, operatorsById, fleet.today)));
  }
  return fleet.employees.map((e) =>
    mapOperator(e, branchesById, pumpLabelByOperator.get(e.id), fleet.today),
  );
}

/** Active operators whose CDL or medical cert is expiring soon (or expired), soonest first. */
export async function listCredentialAlerts(): Promise<CredentialAlertItem[]> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select(EMPLOYEE_COLUMNS)
    .eq('is_operator', true)
    .eq('status', 'active');
  if (error) throw error;

  const today = todayIn(session.timezone);
  return ((data ?? []) as EmployeeRow[])
    .flatMap((row) =>
      credentialAlertsFor(row, today).map((alert) => ({
        operatorId: row.id,
        operatorName: fullName(row),
        ...alert,
      })),
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export async function listPumps(): Promise<PumpItem[]> {
  const fleet = await loadFleet();
  const operatorsById = new Map(fleet.employees.map((e) => [e.id, e]));
  return fleet.equipment.map((row) => mapPump(row, operatorsById, fleet.today));
}

export async function listOperators(): Promise<OperatorItem[]> {
  return buildOperators(await loadFleet());
}

export async function getOperator(id: string): Promise<OperatorItem | null> {
  if (!isUuid(id)) return null;
  const operators = buildOperators(await loadFleet());
  return operators.find((o) => o.id === id) ?? null;
}

export async function listBranchOptions(): Promise<BranchOption[]> {
  await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('branches')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return toBranchOptions(data ?? []);
}
