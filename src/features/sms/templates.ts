export interface TextDraftOrder {
  orderNumber: string;
  customer: string;
  serviceDate: string;
  pourTime: string;
  siteAddress: string;
}

/** The first words of a full name, for "Hi Dave,". */
function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

/** Just a greeting, for texts that are not about one order. */
export function draftGreeting(recipientName: string): string {
  return firstName(recipientName) ? `Hi ${firstName(recipientName)}, ` : 'Hi, ';
}

/** A starting message for the dispatcher to edit before sending. */
export function draftOrderText(
  recipient: 'customer' | 'contact' | 'operator',
  recipientName: string,
  order: TextDraftOrder,
): string {
  const greeting = draftGreeting(recipientName);
  const when = [order.serviceDate, order.pourTime && `at ${order.pourTime}`].filter(Boolean).join(' ');
  const site = order.siteAddress ? ` at ${order.siteAddress}` : '';

  if (recipient === 'operator') {
    return `${greeting}${order.orderNumber} for ${order.customer}: pour ${when}${site}.`;
  }
  return `${greeting}your concrete pump (${order.orderNumber}) is booked for ${when}${site}.`;
}
