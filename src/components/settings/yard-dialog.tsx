'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { createYard, updateYard } from '@/features/yards/server/actions';
import { createYardSchema, type YardFormValues } from '@/features/yards/schemas';
import type { YardItem } from '@/features/yards/types';
import { reportAction } from '@/lib/action-feedback';

interface YardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The yard being edited, or null to add a new one. */
  yard: YardItem | null;
  onSaved: () => void;
}

/** Adds or edits a yard: a name and the address Google drives from. */
export function YardDialog({ open, onOpenChange, yard, onSaved }: YardDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<YardFormValues>({
    resolver: zodResolver(createYardSchema),
    defaultValues: { name: '', address: '' },
  });

  useEffect(() => {
    if (open) reset({ name: yard?.name ?? '', address: yard?.address ?? '' });
  }, [open, yard, reset]);

  const onSubmit = async (values: YardFormValues) => {
    const result = yard
      ? await updateYard({ id: yard.id, name: values.name, address: values.address, isActive: yard.isActive })
      : await createYard(values);
    if (!reportAction(result, { entity: 'yard' })) return;
    toast.success(yard ? 'Yard updated' : 'Yard added', { description: values.name.trim() });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent fullScreenOnMobile className="sm:max-w-[440px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
            {yard ? 'Edit yard' : 'New yard'}
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Where an operator starts the day, such as the shop or their home. Drive time to a job starts here.
          </p>
        </DialogHeader>

        <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-3.5">
          <fieldset disabled={isSubmitting} className="space-y-3.5 min-w-0 border-0 p-0 m-0">
            <FormField id="yard-name" label="Name" error={errors.name?.message}>
              <Input id="yard-name" autoFocus placeholder="Yard #1" className="h-10 text-sm" {...register('name')} />
            </FormField>
            <FormField id="yard-address" label="Address" error={errors.address?.message}>
              <Input
                id="yard-address"
                placeholder="54 Montgomery Ave, Warren, ME 04864"
                className="h-10 text-sm"
                {...register('address')}
              />
            </FormField>
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
                ) : yard ? (
                  'Save yard'
                ) : (
                  'Add yard'
                )}
              </Button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
