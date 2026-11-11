'use client';

import { useEffect } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Textarea } from '@/components/ui/textarea';
import { SMS_MAX_LENGTH, sendTextSchema } from '@/features/sms/schemas';
import { sendOrderText } from '@/features/sms/server/actions';
import { reportAction } from '@/lib/action-feedback';

export interface TextTarget {
  recipient: 'customer' | 'contact' | 'operator';
  recipientId: string;
  name: string;
  phone: string;
  draft: string;
}

interface SendTextDialogProps {
  /** The person to text, or null while the dialog is closed. */
  target: TextTarget | null;
  /** The order the text is about, when sent from an order page. */
  jobId?: string;
  onClose: () => void;
}

interface TextFormValues {
  body: string;
}

/** Writes and sends a text to a customer contact or an operator from an order. */
export function SendTextDialog({ target, jobId, onClose }: SendTextDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TextFormValues>({
    resolver: zodResolver(sendTextSchema.pick({ body: true })),
    defaultValues: { body: '' },
  });

  useEffect(() => {
    if (target) reset({ body: target.draft });
  }, [target, reset]);

  const length = useWatch({ control, name: 'body' })?.length ?? 0;

  const onSubmit = async (values: TextFormValues) => {
    if (!target) return;
    const result = await sendOrderText({
      jobId,
      recipient: target.recipient,
      recipientId: target.recipientId,
      body: values.body,
    });
    if (!reportAction(result, { entity: 'text' })) return;

    if (result.data.status === 'failed') {
      toast.error('Text not sent', { description: result.data.errorMessage ?? 'Twilio did not accept it.' });
      return;
    }
    toast.success(result.data.status === 'dry_run' ? 'Text saved (Twilio is not connected)' : 'Text sent', {
      description: `To ${target.name}`,
    });
    onClose();
  };

  return (
    <Dialog open={target !== null} onOpenChange={(next) => !next && !isSubmitting && onClose()}>
      <DialogContent fullScreenOnMobile className="sm:max-w-[460px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
            Text {target?.name}
          </DialogTitle>
          <p className="text-xs text-slate-500 font-mono">{target?.phone}</p>
        </DialogHeader>

        <form noValidate onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-3.5">
          <fieldset disabled={isSubmitting} className="space-y-3.5 min-w-0 border-0 p-0 m-0">
            <FormField id="text-body" label="Message" error={errors.body?.message}>
              <Textarea id="text-body" autoFocus rows={5} className="min-h-28" {...register('body')} />
            </FormField>
            <p className="text-[11px] text-slate-500 text-right">
              {length}/{SMS_MAX_LENGTH}
            </p>
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
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send text</span>
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
