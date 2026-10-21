'use server';

import { revalidatePath } from 'next/cache';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';
import {
  deletePumpSchema,
  assignPumpOperatorSchema,
  createOperatorSchema,
  createPumpSchema,
  updateOperatorSchema,
  updatePumpSchema,
} from '@/features/fleet/schemas';

const FLEET_EDITORS = ['owner', 'admin', 'dispatcher', 'mechanic'] as const;
const CREW_EDITORS = ['owner', 'admin', 'dispatcher'] as const;

function revalidateFleet() {
  revalidatePath('/pumps');
  revalidatePath('/operators');
}

type PumpInput = {
  unitNumber: string;
  make: string | null;
  model: string | null;
  year: number | null;
  type: 'boom_pump' | 'line_pump';
  boomSize: number | null;
  horizontalReach: number | null;
  hourlyRate: number | null;
  minHours: number | null;
  defaultOperatorId: string | null;
  status: 'available' | 'maintenance';
  maintenanceNote: string | null;
  inspectionDate: string | null;
};

function pumpRecord(input: PumpInput) {
  return {
    equipment_number: input.unitNumber,
    make: input.make,
    model: input.model,
    model_year: input.year,
    type: input.type,
    boom_length_m: input.type === 'boom_pump' ? input.boomSize : null,
    horizontal_reach_ft: input.horizontalReach,
    hourly_rate_override: input.hourlyRate,
    min_hours_override: input.minHours,
    default_operator_id: input.defaultOperatorId,
    status: input.status,
    notes: input.status === 'maintenance' ? input.maintenanceNote : null,
    next_inspection_due: input.inspectionDate,
  };
}

// ── Pumps ───────────────────────────────────────────────────────

export const createPump = authedAction({
  schema: createPumpSchema,
  roles: FLEET_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('equipment')
      .insert(pumpRecord(input))
      .select('id')
      .single();
    if (error) throw error;
    revalidateFleet();
    return { id: data.id };
  },
});

export const updatePump = authedAction({
  schema: updatePumpSchema,
  roles: FLEET_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('equipment')
      .update(pumpRecord(input))
      .eq('id', input.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundError();
    revalidateFleet();
    return { id: input.id };
  },
});

/** Soft delete: the pump is hidden from the fleet but its record and history are kept. */
export const deletePump = authedAction({
  schema: deletePumpSchema,
  roles: FLEET_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('equipment')
      .update({ is_active: false })
      .eq('id', input.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundError();
    revalidateFleet();
    return { id: input.id };
  },
});

export const assignPumpOperator = authedAction({
  schema: assignPumpOperatorSchema,
  roles: FLEET_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('equipment')
      .update({ default_operator_id: input.operatorId })
      .eq('id', input.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundError();
    revalidateFleet();
    return { id: input.id };
  },
});

// ── Operators ───────────────────────────────────────────────────

export const createOperator = authedAction({
  schema: createOperatorSchema,
  roles: CREW_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        first_name: input.firstName,
        last_name: input.lastName,
        job_title: input.role,
        phone: input.phone,
        email: input.email,
        branch_id: input.branchId,
        cdl_expires_on: input.cdlExpiresOn,
        medical_cert_expires_on: input.medicalCertExpiresOn,
        is_operator: true,
        status: 'active',
      })
      .select('id')
      .single();
    if (error) throw error;

    if (input.defaultPumpId) {
      const link = await supabase
        .from('equipment')
        .update({ default_operator_id: data.id })
        .eq('id', input.defaultPumpId);
      if (link.error) throw link.error;
    }

    revalidateFleet();
    return { id: data.id };
  },
});

export const updateOperator = authedAction({
  schema: updateOperatorSchema,
  roles: CREW_EDITORS,
  run: async ({ input, supabase }) => {
    const { data, error } = await supabase
      .from('employees')
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        job_title: input.role,
        phone: input.phone,
        email: input.email,
        branch_id: input.branchId,
        cdl_expires_on: input.cdlExpiresOn,
        medical_cert_expires_on: input.medicalCertExpiresOn,
        status: input.isActive ? 'active' : 'inactive',
      })
      .eq('id', input.id)
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new NotFoundError();

    // The default pump lives on the pump: clear this operator's old pump, then set the new one.
    const clear = await supabase
      .from('equipment')
      .update({ default_operator_id: null })
      .eq('default_operator_id', input.id);
    if (clear.error) throw clear.error;
    if (input.defaultPumpId) {
      const link = await supabase
        .from('equipment')
        .update({ default_operator_id: input.id })
        .eq('id', input.defaultPumpId);
      if (link.error) throw link.error;
    }

    revalidateFleet();
    return { id: input.id };
  },
});
