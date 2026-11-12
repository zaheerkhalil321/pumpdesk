'use server';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';
import { assertUnderLimit, TEXT_LIMIT } from '@/server/rate-limit';
import { sendTextSchema } from '@/features/sms/schemas';
import { sendSms } from '@/features/sms/server/twilio';

const TEXT_SENDERS = ['owner', 'admin', 'dispatcher', 'office'] as const;

/**
 * Texts a customer, a customer contact or an operator. The phone number is read here from the
 * database (never taken from the browser), and every text is recorded, sent or not.
 */
export const sendOrderText = authedAction({
  schema: sendTextSchema,
  roles: TEXT_SENDERS,
  run: async ({ input, session, supabase }) => {
    await assertUnderLimit(supabase, 'sms_messages', session.userId, TEXT_LIMIT);

    const table = { customer: 'customers', contact: 'contacts', operator: 'employees' } as const;
    const { data: person, error: lookupError } = await supabase
      .from(table[input.recipient])
      .select('phone')
      .eq('id', input.recipientId)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (!person) throw new NotFoundError();
    if (!person.phone) throw new Error('This person has no phone number saved.');

    const outcome = await sendSms(person.phone, input.body);

    const { error } = await supabase.from('sms_messages').insert({
      job_id: input.jobId ?? null,
      customer_id: input.recipient === 'customer' ? input.recipientId : null,
      contact_id: input.recipient === 'contact' ? input.recipientId : null,
      employee_id: input.recipient === 'operator' ? input.recipientId : null,
      recipient_kind: input.recipient,
      to_phone: person.phone,
      body: input.body,
      status: outcome.status,
      provider_sid: outcome.providerSid,
      error_code: outcome.errorCode,
      error_message: outcome.errorMessage,
    });
    if (error) throw error;

    return { status: outcome.status, errorMessage: outcome.errorMessage };
  },
});
