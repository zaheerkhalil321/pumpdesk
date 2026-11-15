import { draftGreeting } from '@/features/sms/templates';
import { toDialable } from '@/lib/phone';

/** Someone the dispatcher can text or call: a customer, a customer contact or an operator. */
export interface ReachPerson {
  recipient: 'customer' | 'contact' | 'operator';
  recipientId: string;
  name: string;
  phone: string;
}

/** A tel: link for the phone's own dialer, or null when the number can't be dialed. */
export function callHref(phone: string): string | null {
  const number = toDialable(phone);
  return number ? `tel:${number}` : null;
}

/** An sms: link that opens the phone's own Messages app with the text filled in. */
export function textHref(phone: string, body: string): string | null {
  const number = toDialable(phone);
  if (!number) return null;
  // "?&body=" is read by both iPhone and Android Messages.
  return body ? `sms:${number}?&body=${encodeURIComponent(body)}` : `sms:${number}`;
}

/** Opens the phone's own dialer, so the call goes out from the dispatcher's own number. */
export function openCall(who: ReachPerson) {
  const href = callHref(who.phone);
  if (href) window.location.assign(href);
}

/** Opens the phone's own Messages app, so history and replies stay on the dispatcher's phone. */
export function openText(who: ReachPerson & { draft?: string }) {
  const href = textHref(who.phone, who.draft ?? draftGreeting(who.name));
  if (href) window.location.assign(href);
}
