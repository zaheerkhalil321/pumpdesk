import 'server-only';

import { twilioCreate, type TwilioOutcome } from '@/server/twilio';

/**
 * Rings the dispatcher first, then connects them to the other person. Both numbers are
 * validated E.164 (digits and a plus sign), so they are safe inside the instructions.
 * The other person sees the company's Twilio number, not the dispatcher's own.
 */
export function placeBridgedCall(dispatcherPhone: string, otherPhone: string): Promise<TwilioOutcome> {
  return twilioCreate('Calls', (from) => ({
    To: dispatcherPhone,
    From: from,
    Twiml: `<Response><Say>Connecting your PumpDesk call.</Say><Dial callerId="${from}">${otherPhone}</Dial></Response>`,
  }));
}
