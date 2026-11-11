'use server';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';
import { callerPhoneSchema, placeCallSchema } from '@/features/calls/schemas';
import { placeBridgedCall } from '@/features/calls/server/twilio';
import { toDialable } from '@/lib/phone';

const CALLERS = ['owner', 'admin', 'dispatcher', 'office'] as const;

/** The signed-in user's saved phone, to prefill the call dialog. Empty when they have none. */
export const getCallerPhone = authedAction({
  schema: callerPhoneSchema,
  roles: CALLERS,
  run: async ({ session, supabase }) => {
    const { data, error } = await supabase.from('app_users').select('phone').eq('id', session.userId).maybeSingle();
    if (error) throw error;
    return { phone: data?.phone ?? '' };
  },
});

/**
 * Calls a customer, contact or operator: PumpDesk rings the dispatcher's phone first, then connects
 * them. The other person's number is read here from the database (never taken from the browser),
 * the dispatcher's number is remembered for next time, and every call is recorded.
 */
export const placeCall = authedAction({
  schema: placeCallSchema,
  roles: CALLERS,
  run: async ({ input, session, supabase }) => {
    const table = { customer: 'customers', contact: 'contacts', operator: 'employees' } as const;
    const { data: person, error: lookupError } = await supabase
      .from(table[input.recipient])
      .select('phone')
      .eq('id', input.recipientId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!person) throw new NotFoundError();
    if (!person.phone) throw new Error('This person has no phone number saved.');

    const dispatcherPhone = toDialable(input.yourPhone);
    if (!dispatcherPhone) throw new Error('Invalid phone number.');

    const { error: saveError } = await supabase
      .from('app_users')
      .update({ phone: dispatcherPhone })
      .eq('id', session.userId);
    if (saveError) throw saveError;

    const outcome = await placeBridgedCall(dispatcherPhone, person.phone);

    const { error } = await supabase.from('call_logs').insert({
      job_id: input.jobId ?? null,
      customer_id: input.recipient === 'customer' ? input.recipientId : null,
      contact_id: input.recipient === 'contact' ? input.recipientId : null,
      employee_id: input.recipient === 'operator' ? input.recipientId : null,
      recipient_kind: input.recipient,
      from_phone: dispatcherPhone,
      to_phone: person.phone,
      status: outcome.status,
      provider_sid: outcome.providerSid,
      error_code: outcome.errorCode,
      error_message: outcome.errorMessage,
    });
    if (error) throw error;

    return { status: outcome.status, errorMessage: outcome.errorMessage };
  },
});
