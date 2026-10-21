import { z } from 'zod';

import { toE164 } from '@/lib/phone';

/** Shared by the forms and the Server Actions. Only editable fields are listed. */

const uuid = z.string().uuid();

const boundedNumber = (label: string, min: number, max: number) =>
  z
    .number({ error: `${label} must be a number` })
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`)
    .nullable();

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => (value === '' ? null : value));

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Keep this under ${max} characters`);

const isoDate = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Enter a valid date')
  .transform((v) => (v === '' ? null : v));

const phone = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null;
    const e164 = toE164(value);
    if (!e164) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid US phone number' });
      return z.NEVER;
    }
    return e164;
  });

const email = z
  .string()
  .trim()
  .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address')
  .transform((v) => (v === '' ? null : v.toLowerCase()));

const pumpFields = {
  unitNumber: requiredText('Unit number', 15),
  make: optionalText(60),
  model: optionalText(60),
  year: boundedNumber('Model year', 1980, 2030),
  type: z.enum(['boom_pump', 'line_pump']),
  boomSize: boundedNumber('Boom size', 1, 100),
  horizontalReach: boundedNumber('Horizontal reach', 0, 500),
  hourlyRate: boundedNumber('Hourly rate', 0, 5000),
  minHours: boundedNumber('Minimum callout', 1, 24),
  defaultOperatorId: uuid.nullable(),
  status: z.enum(['available', 'maintenance']),
  maintenanceNote: optionalText(200),
  inspectionDate: isoDate,
};

export const createPumpSchema = z.object(pumpFields).refine(
  (p) => p.type !== 'boom_pump' || p.boomSize !== null,
  { path: ['boomSize'], message: 'Boom size is required for a boom pump' },
);

export const updatePumpSchema = z.object({ id: uuid, ...pumpFields }).refine(
  (p) => p.type !== 'boom_pump' || p.boomSize !== null,
  { path: ['boomSize'], message: 'Boom size is required for a boom pump' },
);

export const deletePumpSchema = z.object({ id: uuid });

export const assignPumpOperatorSchema = z.object({ id: uuid, operatorId: uuid.nullable() });

const operatorFields = {
  firstName: requiredText('First name', 60),
  lastName: requiredText('Last name', 60),
  role: optionalText(80),
  phone,
  email,
  branchId: uuid.nullable(),
  cdlExpiresOn: isoDate,
  medicalCertExpiresOn: isoDate,
};

export const createOperatorSchema = z.object({
  ...operatorFields,
  defaultPumpId: uuid.nullable(),
});

export const updateOperatorSchema = z.object({
  id: uuid,
  ...operatorFields,
  isActive: z.boolean(),
  defaultPumpId: uuid.nullable(),
});
