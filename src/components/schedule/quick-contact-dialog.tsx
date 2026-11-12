'use client';

import { Loader2 } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { createContact } from '@/features/crm/server/actions';
import type { OrderFormContact } from '@/features/orders/types';
import { reportAction } from '@/lib/action-feedback';
import { formatUSPhone } from '@/lib/utils';

const quickContactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60, 'Keep this under 60 characters'),
  lastName: z.string().trim().min(1, 'Last name is required').max(60, 'Keep this under 60 characters'),
  jobTitle: z.string(),
  phone: z.string(),
  email: z.string(),
});

type QuickContactValues = z.infer<typeof quickContactSchema>;

interface QuickContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  /** Called with the saved contact so the order form can pick it. */
  onCreated: (contact: OrderFormContact) => void;
  onReload: () => void;
}

/** Adds a contact to the customer without leaving the New order form, so nothing typed there is lost. */
export function QuickContactDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  onCreated,
  onReload,
}: QuickContactDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuickContactValues>({
    resolver: zodResolver(quickContactSchema),
    defaultValues: { firstName: '', lastName: '', jobTitle: '', phone: '', email: '' },
  });

  const close = (next: boolean) => {
    if (!next && isSubmitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = async (values: QuickContactValues) => {
    const result = await createContact({
      firstName: values.firstName,
      lastName: values.lastName,
      jobTitle: values.jobTitle,
      phone: values.phone,
      email: values.email,
      customerId,
    });
    if (!result.ok) {
      if (result.fieldErrors?.phone?.[0]) setError('phone', { message: result.fieldErrors.phone[0] });
      else if (result.fieldErrors?.email?.[0]) setError('email', { message: result.fieldErrors.email[0] });
      else reportAction(result, { entity: 'contact' });
      return;
    }
    const name = `${values.firstName.trim()} ${values.lastName.trim()}`;
    toast.success('Contact added', { description: `${name} for ${customerName}` });
    onCreated({ id: result.data.id, name, role: values.jobTitle.trim(), phone: formatUSPhone(values.phone) });
    onReload();
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent fullScreenOnMobile className="sm:max-w-[420px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">New contact</DialogTitle>
          <p className="text-xs text-slate-500">For {customerName}. Your order stays open.</p>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(e) => {
            // This dialog sits inside the order form, so keep the submit from reaching it.
            e.stopPropagation();
            void handleSubmit(onSubmit)(e);
          }}
          className="space-y-3.5"
        >
          <fieldset disabled={isSubmitting} className="space-y-3.5 min-w-0 border-0 p-0 m-0">
          <div className="grid grid-cols-2 gap-3">
            <FormField id="quick-contact-first" label="First name" error={errors.firstName?.message}>
              <Input id="quick-contact-first" autoFocus className="h-10 text-sm" {...register('firstName')} />
            </FormField>
            <FormField id="quick-contact-last" label="Last name" error={errors.lastName?.message}>
              <Input id="quick-contact-last" className="h-10 text-sm" {...register('lastName')} />
            </FormField>
          </div>
          <FormField id="quick-contact-title" label="Job title">
            <Input id="quick-contact-title" placeholder="e.g. Superintendent" className="h-10 text-sm" {...register('jobTitle')} />
          </FormField>
          <FormField id="quick-contact-phone" label="Phone" error={errors.phone?.message}>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <PhoneInput
                  id="quick-contact-phone"
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.phone?.message}
                  className="h-10 text-sm"
                />
              )}
            />
          </FormField>
          <FormField id="quick-contact-email" label="Email" error={errors.email?.message}>
            <Input id="quick-contact-email" type="email" className="h-10 text-sm" {...register('email')} />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="h-9 px-4 text-xs font-semibold" disabled={isSubmitting} onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" size="sm" disabled={isSubmitting} className="h-9 px-5 text-xs font-semibold gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Adding contact...</span>
                </>
              ) : (
                'Add contact'
              )}
            </Button>
          </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
