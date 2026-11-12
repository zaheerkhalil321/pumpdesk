'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { AppSelect } from '@/components/ui/app-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { createBranch, updateBranch } from '@/features/branches/server/actions';
import { createBranchSchema, type BranchFormValues, type BranchFormOutput } from '@/features/branches/schemas';
import type { BranchItem } from '@/features/branches/types';
import { US_STATES } from '@/features/company/states';
import { parseUsAddress } from '@/features/orders/address';
import { reportAction } from '@/lib/action-feedback';

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The branch being edited, or null to add a new one. */
  branch: BranchItem | null;
  /** True when the company has no branches yet, so the first one starts as the main branch. */
  isFirst: boolean;
  onSaved: () => void;
}

const valuesOf = (branch: BranchItem | null, isFirst: boolean): BranchFormValues => ({
  name: branch?.name ?? '',
  code: branch?.code ?? '',
  streetAddress: branch?.streetAddress ?? '',
  city: branch?.city ?? '',
  state: branch?.state ?? 'ME',
  zipCode: branch?.zipCode ?? '',
  phone: branch?.phone ?? '',
  isHq: branch?.isHq ?? isFirst,
});

/** Adds or edits a branch: its name, short code, address and phone, and whether it is the main branch. */
export function BranchDialog({ open, onOpenChange, branch, isFirst, onSaved }: BranchDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues, unknown, BranchFormOutput>({
    resolver: zodResolver(createBranchSchema),
    defaultValues: valuesOf(null, isFirst),
  });

  useEffect(() => {
    if (open) reset(valuesOf(branch, isFirst));
  }, [open, branch, isFirst, reset]);

  /** A Google pick fills the street, town, state and ZIP (Google often leaves the ZIP out, so a typed one stays). */
  const fillFromGoogle = (text: string) => {
    const parsed = parseUsAddress(text);
    const set = { shouldDirty: true, shouldValidate: true } as const;
    if (!parsed) {
      setValue('streetAddress', text, set);
      return;
    }
    // A pick without a street (rare with street-only suggestions) keeps what was typed in the street box.
    if (parsed.addressLine1) setValue('streetAddress', parsed.addressLine1, set);
    setValue('city', parsed.city, set);
    setValue('state', parsed.state, set);
    if (parsed.postalCode) setValue('zipCode', parsed.postalCode, set);
  };

  // The form is checked here; the server checks the same typed values again, so it gets them as typed.
  const onSubmit = async () => {
    const values = getValues();
    const result = branch
      ? await updateBranch({ ...values, id: branch.id, isActive: branch.isActive || values.isHq })
      : await createBranch(values);
    if (!reportAction(result, { entity: 'branch' })) return;
    toast.success(branch ? 'Branch updated' : 'Branch added', { description: values.name.trim() });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent fullScreenOnMobile className="sm:max-w-[520px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
            {branch ? 'Edit branch' : 'New branch'}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            A location the company runs from. The main branch is the shop that drive time starts from when an
            operator has no home yard.
          </p>
        </DialogHeader>

        <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-3.5">
          <fieldset disabled={isSubmitting} className="space-y-3.5 min-w-0 border-0 p-0 m-0">
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <FormField id="branch-name" label="Name" error={errors.name?.message}>
                <Input id="branch-name" autoFocus placeholder="Warren HQ" className="h-10 text-sm" {...register('name')} />
              </FormField>
              <FormField id="branch-code" label="Code" error={errors.code?.message}>
                <Input id="branch-code" placeholder="Auto" className="h-10 text-sm uppercase" {...register('code')} />
              </FormField>
            </div>

            <FormField id="branch-street" label="Street address" error={errors.streetAddress?.message}>
              <Controller
                control={control}
                name="streetAddress"
                render={({ field }) => (
                  <AddressAutocomplete
                    id="branch-street"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    onPick={fillFromGoogle}
                    streetsOnly
                    placeholder="Start typing, e.g. 50 Niilo Hill Rd"
                    error={Boolean(errors.streetAddress)}
                    className="h-10 text-sm"
                  />
                )}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem_6.5rem]">
              <FormField id="branch-city" label="Town or city" error={errors.city?.message}>
                <Input id="branch-city" placeholder="Warren" className="h-10 text-sm" {...register('city')} />
              </FormField>
              <FormField id="branch-state" label="State" error={errors.state?.message}>
                <Controller
                  control={control}
                  name="state"
                  render={({ field }) => (
                    <AppSelect
                      id="branch-state"
                      value={field.value}
                      onChange={field.onChange}
                      options={US_STATES}
                      className="h-10 w-full text-sm"
                      contentClassName="max-h-64"
                    />
                  )}
                />
              </FormField>
              <FormField id="branch-zip" label="ZIP" error={errors.zipCode?.message}>
                <Input id="branch-zip" placeholder="04864" inputMode="numeric" className="h-10 text-sm" {...register('zipCode')} />
              </FormField>
            </div>

            <FormField id="branch-phone" label="Phone (optional)" error={errors.phone?.message}>
              <Controller
                control={control}
                name="phone"
                render={({ field }) => (
                  <PhoneInput
                    id="branch-phone"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    error={errors.phone?.message}
                    className="h-10 text-sm"
                  />
                )}
              />
            </FormField>

            <Controller
              control={control}
              name="isHq"
              render={({ field }) => (
                <div className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
                  <Checkbox
                    id="branch-hq"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    // The main branch can only change by making another branch the main one.
                    disabled={branch?.isHq}
                    className="mt-0.5"
                  />
                  <label htmlFor="branch-hq" className="cursor-pointer select-none text-xs text-slate-600">
                    <span className="block font-semibold text-slate-900">Main branch (HQ)</span>
                    {branch?.isHq
                      ? 'To change this, make another branch the main one.'
                      : 'Drive time starts here when an operator has no home yard. Only one branch can be the main one.'}
                  </label>
                </div>
              )}
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-4 text-xs font-semibold"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" size="sm" disabled={isSubmitting} className="h-9 px-5 text-xs font-semibold gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : branch ? (
                  'Save branch'
                ) : (
                  'Add branch'
                )}
              </Button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
