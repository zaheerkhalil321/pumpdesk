'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createJobSite } from '@/features/crm/server/actions';
import { createJobSiteSchema } from '@/features/crm/schemas';
import { formatAddress } from '@/features/crm/mappers';
import { reportAction } from '@/lib/action-feedback';
import { cn } from '@/lib/utils';

interface AddSiteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  /** Called with the saved site, e.g. so an order form can pick it. */
  onCreated?: (site: { id: string; label: string; address: string }) => void;
}

type Field = 'addressLine1' | 'city' | 'state' | 'postalCode' | 'name';

const INPUT =
  'h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs transition-colors';
const ERROR_INPUT = 'border-red-500 bg-red-50/20 text-red-900 focus-visible:border-red-500';

/** Adds a job site to a customer without leaving the page. Only the town is required. */
export function AddSiteModal({ open, onOpenChange, customerId, customerName, onCreated }: AddSiteModalProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('ME');
  const [postalCode, setPostalCode] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  const edit = (field: Field, setter: (value: string) => void) => (value: string) => {
    setter(value);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { customerId, name, addressLine1, city, state, postalCode, timezone: '' };
    const check = createJobSiteSchema.safeParse(payload);
    if (!check.success) {
      const fieldErrors = check.error.flatten().fieldErrors as Partial<Record<Field, string[]>>;
      setErrors(Object.fromEntries(Object.entries(fieldErrors).map(([field, messages]) => [field, messages?.[0]])));
      return;
    }

    startSaving(async () => {
      const result = await createJobSite(payload);
      if (!reportAction(result, { entity: 'job site', refresh: () => router.refresh() })) return;

      const address = formatAddress({
        line1: addressLine1.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
      });
      onCreated?.({
        id: result.data.id,
        label: name.trim() ? `${name.trim()} · ${address}` : address,
        address,
      });
      toast.success('Job site added', { description: `${name.trim() || address} added for ${customerName}.` });
      onOpenChange(false);
    });
  };

  const fieldError = (field: Field) =>
    errors[field] ? <p className="text-[11px] text-red-500 font-medium">{errors[field]}</p> : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent fullScreenOnMobile className="sm:max-w-[430px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
            Add job site for {customerName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Site name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              value={name}
              onChange={(e) => edit('name', setName)(e.target.value)}
              placeholder="e.g. Rockland Medical Plaza"
              className={cn(INPUT, errors.name && ERROR_INPUT)}
            />
            {fieldError('name')}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Address or cross streets <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              value={addressLine1}
              onChange={(e) => edit('addressLine1', setAddressLine1)(e.target.value)}
              placeholder="Optional: street or cross streets"
              className={cn(INPUT, errors.addressLine1 && ERROR_INPUT)}
            />
            {fieldError('addressLine1')}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Town <span className="text-red-500">*</span>
              </label>
              <Input
                value={city}
                onChange={(e) => edit('city', setCity)(e.target.value)}
                placeholder="e.g. Rockland"
                className={cn(INPUT, errors.city && ERROR_INPUT)}
              />
              {fieldError('city')}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                State <span className="text-red-500">*</span>
              </label>
              <Input
                value={state}
                onChange={(e) => edit('state', setState)(e.target.value.toUpperCase())}
                maxLength={2}
                className={cn(INPUT, errors.state && ERROR_INPUT)}
              />
              {fieldError('state')}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              ZIP code <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Input
              value={postalCode}
              onChange={(e) => edit('postalCode', setPostalCode)(e.target.value)}
              maxLength={10}
              placeholder="e.g. 04841"
              className={cn(INPUT, errors.postalCode && ERROR_INPUT)}
            />
            {fieldError('postalCode')}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4.5 text-xs font-semibold bg-brand hover:bg-brand-hover text-white cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Add job site'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
