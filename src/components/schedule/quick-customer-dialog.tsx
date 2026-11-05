'use client';

import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { createCustomer } from '@/features/crm/server/actions';
import { reportAction } from '@/lib/action-feedback';
import { formatUSPhone } from '@/lib/utils';

const quickCustomerSchema = z.object({
  businessName: z.string().trim().min(1, 'Company name is required').max(120, 'Keep this under 120 characters'),
  phone: z.string(),
  email: z.string(),
});

type QuickCustomerValues = z.infer<typeof quickCustomerSchema>;

interface QuickCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the saved customer so the order form can pick it. */
  onCreated: (customer: { id: string; name: string }) => void;
  onReload: () => void;
}

/** Adds a customer without leaving the New order form, so nothing typed there is lost. */
export function QuickCustomerDialog({ open, onOpenChange, onCreated, onReload }: QuickCustomerDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuickCustomerValues>({
    resolver: zodResolver(quickCustomerSchema),
    defaultValues: { businessName: '', phone: '', email: '' },
  });

  const close = (next: boolean) => {
    if (!next && isSubmitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const onSubmit = async (values: QuickCustomerValues) => {
    const result = await createCustomer({
      businessName: values.businessName,
      phone: values.phone,
      email: values.email,
    });
    if (!result.ok) {
      if (result.fieldErrors?.phone?.[0]) setError('phone', { message: result.fieldErrors.phone[0] });
      else if (result.fieldErrors?.email?.[0]) setError('email', { message: result.fieldErrors.email[0] });
      else reportAction(result, { entity: 'customer' });
      return;
    }
    toast.success('Customer added', { description: values.businessName.trim() });
    onCreated({ id: result.data.id, name: values.businessName.trim() });
    onReload();
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent fullScreenOnMobile className="sm:max-w-[420px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">New customer</DialogTitle>
          <p className="text-xs text-slate-500">Your order stays open. You can add more details later.</p>
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
          <FormField id="quick-customer-name" label="Company name" error={errors.businessName?.message}>
            <Input id="quick-customer-name" autoFocus className="h-10 text-sm" {...register('businessName')} />
          </FormField>
          <FormField id="quick-customer-phone" label="Phone" error={errors.phone?.message}>
            <Input
              id="quick-customer-phone"
              type="tel"
              maxLength={14}
              className="h-10 text-sm"
              {...register('phone', { onChange: (e) => setValue('phone', formatUSPhone(e.target.value)) })}
            />
          </FormField>
          <FormField id="quick-customer-email" label="Email" error={errors.email?.message}>
            <Input id="quick-customer-email" type="email" className="h-10 text-sm" {...register('email')} />
          </FormField>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" className="h-9 px-4 text-xs font-semibold" disabled={isSubmitting} onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="brand" size="sm" disabled={isSubmitting} className="h-9 px-5 text-xs font-semibold gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Adding customer...</span>
                </>
              ) : (
                'Add customer'
              )}
            </Button>
          </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
