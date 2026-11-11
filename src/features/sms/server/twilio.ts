import 'server-only';

import { twilioCreate, type TwilioOutcome } from '@/server/twilio';

/** Sends one text through Twilio. */
export function sendSms(to: string, body: string): Promise<TwilioOutcome> {
  return twilioCreate('Messages', (from) => ({ To: to, From: from, Body: body }));
}
