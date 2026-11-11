'use client';

import { useEffect } from 'react';
import { Loader2, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { placeCallSchema } from '@/features/calls/schemas';
import { getCallerPhone, placeCall } from '@/features/calls/server/actions';
import { reportAction } from '@/lib/action-feedback';

export interface CallTarget {
  recipient: 'customer' | 'contact' | 'operator';
  recipientId: string;
  name: string;
  phone: string;
}

interface CallDialogProps {
  /** The person to call, or null while the dialog is closed. */
  target: CallTarget | null;
  /** The order the call is about, when placed from an order page. */
  jobId?: string;
  onClose: () => void;
}

interface CallFormValues {
  yourPhone: string;
}

/** Rings the dispatcher's own phone first, then connects them to a customer, contact or operator. */
export function CallDialog({ target, jobId, onClose }: CallDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CallFormValues>({
    resolver: zodResolver(placeCallSchema.pick({ yourPhone: true })),
    defaultValues: { yourPhone: '' },
  });

  useEffect(() => {
    if (!target) return;
    reset({ yourPhone: '' });
    void getCallerPhone({}).then((result) => {
      if (result.ok && result.data.phone) setValue('yourPhone', result.data.phone);
    });
  }, [target, reset, setValue]);

  const onSubmit = async (values: CallFormValues) => {
    if (!target) return;
    const result = await placeCall({
      jobId,
      recipient: target.recipient,
      recipientId: target.recipientId,
      yourPhone: values.yourPhone,
    });
    if (!reportAction(result, { entity: 'call' })) return;

    if (result.data.status === 'failed') {
      toast.error('Call not placed', { description: result.data.errorMessage ?? 'Twilio did not accept it.' });
      return;
    }
    toast.success(result.data.status === 'dry_run' ? 'Call saved (Twilio is not connected)' : 'Calling you now', {
      description: `Pick up and you will be connected to ${target.name}`,
    });
    onClose();
  };

  return (
    <Dialog open={target !== null} onOpenChange={(next) => !next && !isSubmitting && onClose()}>
      <DialogContent fullScreenOnMobile className="sm:max-w-[440px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">Call {target?.name}</DialogTitle>
          <p className="text-xs text-slate-500 font-mono">{target?.phone}</p>
          <p className="text-xs text-slate-500">
            We ring your phone first. When you pick up, we connect you. They see the company number.
          </p>
        </DialogHeader>

        <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-3.5">
          <fieldset disabled={isSubmitting} className="space-y-3.5 min-w-0 border-0 p-0 m-0">
            <FormField id="call-your-phone" label="Your phone" error={errors.yourPhone?.message}>
              <Input
                id="call-your-phone"
                type="tel"
                autoFocus
                placeholder="(207) 555-0110"
                className="h-10 text-sm"
                {...register('yourPhone')}
              />
            </FormField>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 px-4 text-xs font-semibold"
                disabled={isSubmitting}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" variant="brand" size="sm" disabled={isSubmitting} className="h-9 px-5 text-xs font-semibold gap-1.5">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Calling...</span>
                  </>
                ) : (
                  <>
                    <Phone className="h-3.5 w-3.5" />
                    <span>Call me first</span>
                  </>
                )}
              </Button>
            </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
