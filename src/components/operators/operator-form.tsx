'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { AppSelect } from '@/components/ui/app-select';
import { DatePicker } from '@/components/ui/date-picker';
import { StatusSwitch } from '@/components/ui/status-switch';
import { createOperator, updateOperator } from '@/features/fleet/server/actions';
import { createOperatorSchema, updateOperatorSchema } from '@/features/fleet/schemas';
import { getYardOptions } from '@/features/yards/server/actions';
import { getPumpDisplayName } from '@/features/fleet/format';
import type { BranchOption, OperatorItem, PumpItem } from '@/features/fleet/types';
import { reportAction } from '@/lib/action-feedback';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = ['Operator', 'Lead operator', 'Relief operator'];
const NO_PUMP = 'none';
const NO_BRANCH = 'none';
const NO_YARD = 'none';

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
  /** Shows a Delete button on the left of the footer (edit mode). */
  onDelete?: () => void;
  onSaved?: (id: string) => void;
}

/** Add and edit operator form, shared by both modals. */
export function OperatorForm({
  operator,
  pumps,
  branchOptions,
  initialPumpId,
  onClose,
  onDelete,
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
  const [homeYardId, setHomeYardId] = useState(operator?.homeYardId ?? NO_YARD);
  const [yardOptions, setYardOptions] = useState<{ value: string; label: string }[]>([]);
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
    { value: NO_PUMP, label: 'None (Unassigned)' },
    ...pumps.map((p) => ({
      value: p.id,
      label: `${getPumpDisplayName(p)} ${p.make} ${p.model}`.trim(),
    })),
  ];
  // The yards come from Settings. An inactive yard the operator already has stays in the list.
  useEffect(() => {
    let cancelled = false;
    void getYardOptions({}).then((result) => {
      if (!cancelled && result.ok) setYardOptions(result.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const yardSelectOptions = [{ value: NO_YARD, label: 'Shop (no home yard)' }, ...yardOptions];
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
      homeYardId: homeYardId === NO_YARD ? null : homeYardId,
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
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 min-w-0">
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
        <div className="space-y-1.5 min-w-0">
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
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-semibold text-slate-700 block">Role</label>
          <AppSelect size="lg" value={role} onChange={setRole} options={roleOptions} />
        </div>
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-semibold text-slate-700 block">Default pump</label>
          <AppSelect size="lg" value={pumpId} onChange={setPumpId} options={pumpOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-semibold text-slate-700 block">Phone number</label>
          <PhoneInput
            value={phone}
            onValueChange={edit('phone', setPhone)}
            placeholder="(207) 555-0168"
            error={errors.phone}
            className={inputClass('phone')}
          />
          <FieldError message={errors.phone} />
        </div>
        <div className="space-y-1.5 min-w-0">
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

      <div className="space-y-1.5 min-w-0">
        <label className="text-xs font-semibold text-slate-700 block">Branch</label>
        <AppSelect size="lg" value={branchId} onChange={setBranchId} options={branchSelectOptions} />
      </div>

      <div className="space-y-1.5 min-w-0">
        <label className="text-xs font-semibold text-slate-700 block">Home yard</label>
        <AppSelect size="lg" value={homeYardId} onChange={setHomeYardId} options={yardSelectOptions} />
        <p className="text-[11px] text-slate-400">Where this operator starts the day. Travel time to a job is worked out from here.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5 min-w-0">
          <label className="text-xs font-semibold text-slate-700 block">CDL expires</label>
          <DatePicker
            ariaLabel="CDL expiry date"
            value={cdlExpiresOn}
            onChange={setCdlExpiresOn}
            placeholder="Pick a date"
          />
        </div>
        <div className="space-y-1.5 min-w-0">
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

      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 pb-2 border-t border-slate-100">
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="mr-auto max-sm:order-last max-sm:w-full h-9 px-3 text-xs font-semibold cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete operator</span>
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-9 px-4 text-xs font-semibold cursor-pointer max-sm:flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="brand"
          size="sm"
          disabled={isSaving}
          className="h-9 px-5 text-xs font-semibold cursor-pointer max-sm:flex-1"
        >
          {isSaving ? 'Saving...' : operator ? 'Save changes' : 'Add operator'}
        </Button>
      </div>
    </form>
  );
}
