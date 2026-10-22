'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/components/ui/app-select';
import { DatePicker } from '@/components/ui/date-picker';
import { StatusSwitch } from '@/components/ui/status-switch';
import { createOperator, updateOperator } from '@/features/fleet/server/actions';
import { createOperatorSchema, updateOperatorSchema } from '@/features/fleet/schemas';
import { getPumpDisplayName } from '@/features/fleet/format';
import type { BranchOption, OperatorItem, PumpItem } from '@/features/fleet/types';
import { reportAction } from '@/lib/action-feedback';
import { cn, formatUSPhone } from '@/lib/utils';

const ROLE_OPTIONS = ['Operator', 'Lead operator', 'Relief operator'];
const NO_PUMP = 'none';
const NO_BRANCH = 'none';

const INPUT_CLASS =
  'h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs';

const ERROR_INPUT_CLASS = 'border-red-500 bg-red-50/20 text-red-900 focus-visible:border-red-500';

type FieldErrors = Partial<Record<string, string>>;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[11px] text-red-500 font-medium">{message}</p>;
}

interface OperatorFormProps {
  /** Pass an operator to edit it, or leave empty to create one. */
  operator?: OperatorItem;
  pumps: PumpItem[];
  branchOptions: BranchOption[];
  /** Pump to pre-select when creating an operator from a pump form. */
  initialPumpId?: string;
  onClose: () => void;
  onSaved?: (id: string) => void;
}

/** Add and edit operator form, shared by both modals. */
export function OperatorForm({
  operator,
  pumps,
  branchOptions,
  initialPumpId,
  onClose,
  onSaved,
}: OperatorFormProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();

  const currentPump = operator
    ? pumps.find((p) => p.defaultOperator.id === operator.id)
    : undefined;

  const [firstName, setFirstName] = useState(operator?.firstName ?? '');
  const [lastName, setLastName] = useState(operator?.lastName ?? '');
  const [role, setRole] = useState(operator?.role ?? 'Operator');
  const [phone, setPhone] = useState(operator?.phone ?? '');
  const [email, setEmail] = useState(operator?.email ?? '');
  const [branchId, setBranchId] = useState(operator?.branchId ?? NO_BRANCH);
  const [pumpId, setPumpId] = useState(currentPump?.id ?? initialPumpId ?? NO_PUMP);
  const [cdlExpiresOn, setCdlExpiresOn] = useState(operator?.cdlExpiresOn ?? '');
  const [medicalExpiresOn, setMedicalExpiresOn] = useState(operator?.medicalCertExpiresOn ?? '');
  const [isActive, setIsActive] = useState(operator ? operator.status === 'Active' : true);
  const [errors, setErrors] = useState<FieldErrors>({});

  /** Updates a field and clears its error message as soon as the user types again. */
  const edit = (field: string, setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const inputClass = (field: string) => cn(INPUT_CLASS, errors[field] && ERROR_INPUT_CLASS);

  const roleOptions = ROLE_OPTIONS.includes(role) ? ROLE_OPTIONS : [...ROLE_OPTIONS, role];
  const pumpOptions = [
    { value: NO_PUMP, label: 'None (Unassigned / Optional)' },
    ...pumps.map((p) => ({
      value: p.id,
      label: `${getPumpDisplayName(p)} ${p.make} ${p.model}`.trim(),
    })),
  ];
  const branchSelectOptions = [{ value: NO_BRANCH, label: 'No branch' }, ...branchOptions];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const base = {
      firstName,
      lastName,
      role,
      phone,
      email,
      branchId: branchId === NO_BRANCH ? null : branchId,
      cdlExpiresOn,
      medicalCertExpiresOn: medicalExpiresOn,
      defaultPumpId: pumpId === NO_PUMP ? null : pumpId,
    };
    const payload = operator ? { id: operator.id, ...base, isActive } : base;

    const check = (operator ? updateOperatorSchema : createOperatorSchema).safeParse(payload);
    if (!check.success) {
      const fieldErrors = check.error.flatten().fieldErrors as Record<string, string[] | undefined>;
      const next: FieldErrors = {};
      for (const [field, messages] of Object.entries(fieldErrors)) next[field] = messages?.[0];
      setErrors(next);
      if (Object.keys(next).length === 0) toast.error('Please check the form.');
      return;
    }
    setErrors({});

    startSaving(async () => {
      const refresh = () => router.refresh();
      const result = operator
        ? await updateOperator({ id: operator.id, ...base, isActive })
        : await createOperator(base);
      if (!reportAction(result, { entity: 'operator', refresh })) return;

      toast.success(operator ? 'Profile updated' : 'Operator added successfully', {
        description: `${firstName.trim()} ${lastName.trim()}${operator ? "'s details have been saved." : ' has been added to the crew roster.'}`,
      });
      onSaved?.(result.data.id);
      onClose();
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            First name <span className="text-red-500">*</span>
          </label>
          <Input
            value={firstName}
            onChange={(e) => edit('firstName', setFirstName)(e.target.value)}
            placeholder="e.g. Rob"
            className={inputClass('firstName')}
          />
          <FieldError message={errors.firstName} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Last name <span className="text-red-500">*</span>
          </label>
          <Input
            value={lastName}
            onChange={(e) => edit('lastName', setLastName)(e.target.value)}
            placeholder="e.g. Black"
            className={inputClass('lastName')}
          />
          <FieldError message={errors.lastName} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">Role</label>
          <AppSelect size="lg" value={role} onChange={setRole} options={roleOptions} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 block">Default pump</label>
            <span className="text-[10px] text-slate-400 font-medium">Optional</span>
          </div>
          <AppSelect size="lg" value={pumpId} onChange={setPumpId} options={pumpOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">Phone number</label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => edit('phone', setPhone)(formatUSPhone(e.target.value))}
            placeholder="(207) 555-0168"
            maxLength={14}
            className={inputClass('phone')}
          />
          <FieldError message={errors.phone} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => edit('email', setEmail)(e.target.value)}
            placeholder="rob@midcoast.example"
            className={inputClass('email')}
          />
          <FieldError message={errors.email} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">Branch yard</label>
        <AppSelect size="lg" value={branchId} onChange={setBranchId} options={branchSelectOptions} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">CDL expires</label>
          <DatePicker
            ariaLabel="CDL expiry date"
            value={cdlExpiresOn}
            onChange={setCdlExpiresOn}
            placeholder="Pick a date"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">Medical certificate expires</label>
          <DatePicker
            ariaLabel="Medical certificate expiry date"
            value={medicalExpiresOn}
            onChange={setMedicalExpiresOn}
            placeholder="Pick a date"
          />
        </div>
      </div>

      {operator && (
        <StatusSwitch
          title="Operator status"
          ariaLabel="Operator is active"
          checked={isActive}
          onCheckedChange={setIsActive}
          description={(on) =>
            on ? 'Active: can be assigned to jobs.' : 'Inactive: kept on file, not offered for new jobs.'
          }
        />
      )}

      <p className="text-[11px] text-slate-400">
        Emergency contacts are coming in a later release.
      </p>

      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-9 px-4 text-xs font-semibold cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="brand"
          size="sm"
          disabled={isSaving}
          className="h-9 px-5 text-xs font-semibold cursor-pointer"
        >
          {isSaving ? 'Saving...' : operator ? 'Save changes' : 'Add operator'}
        </Button>
      </div>
    </form>
  );
}
