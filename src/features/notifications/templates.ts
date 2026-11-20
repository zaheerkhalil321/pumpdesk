import { formatInTimeZone } from 'date-fns-tz';

import { formatE164 } from '@/lib/phone';
import type { NotificationEvent } from '@/features/notifications/events';

/** Long enough for a short message, short enough to stay one or two text segments. */
export const NOTIFICATION_TEXT_MAX = 320;

export interface NotificationTextData {
  recipientName: string;
  companyName: string;
  jobNumber: string;
  timezone: string;
  scheduledStart: string;
  siteLabel: string;
  operatorName: string | null;
  operatorPhone: string | null;
  yardsPumped: number | null;
  pumpHours: number | null;
}

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

function sign(body: string, data: NotificationTextData): string {
  return `${body} - ${data.companyName}`;
}

function greeting(data: NotificationTextData): string {
  return `Hi ${data.recipientName.trim()}`;
}

function number(value: number): string {
  return String(Math.round(value * 10) / 10);
}

function orderConfirmation(data: NotificationTextData): string {
  const when = `${formatInTimeZone(data.scheduledStart, data.timezone, 'EEE MMM d')} at ${formatInTimeZone(data.scheduledStart, data.timezone, 'h:mm a')}`;
  return sign(
    `${greeting(data)}, your concrete pump for ${data.jobNumber} is confirmed for ${when}, ${clip(data.siteLabel, 80)}.`,
    data,
  );
}

function operatorDetails(data: NotificationTextData): string {
  const phone = formatE164(data.operatorPhone);
  const operator = data.operatorName ?? 'Your operator';
  const tail = phone ? ` Operator phone ${phone}.` : '';
  return sign(`${greeting(data)}, ${operator} will run your pump for ${data.jobNumber}.${tail}`, data);
}

function pumpEnRoute(data: NotificationTextData): string {
  return sign(
    `${greeting(data)}, the pump for ${data.jobNumber} has left the yard and is on its way to ${clip(data.siteLabel, 80)}.`,
    data,
  );
}

function workTicketReview(data: NotificationTextData): string {
  const parts: string[] = [];
  if (data.yardsPumped !== null) parts.push(`${number(data.yardsPumped)} yd³ pumped`);
  if (data.pumpHours !== null) parts.push(`${number(data.pumpHours)} pump hours`);
  const detail = parts.length > 0 ? `: ${parts.join(', ')}` : '';
  return sign(`${greeting(data)}, the pour for ${data.jobNumber} is done${detail}. Thank you!`, data);
}

/** The text for one of the four automatic messages, or null for a message that is not sent yet. */
export function renderNotificationText(event: NotificationEvent, data: NotificationTextData): string | null {
  switch (event) {
    case 'order_confirmation':
      return clip(orderConfirmation(data), NOTIFICATION_TEXT_MAX);
    case 'operator_details':
      return clip(operatorDetails(data), NOTIFICATION_TEXT_MAX);
    case 'pump_en_route':
      return clip(pumpEnRoute(data), NOTIFICATION_TEXT_MAX);
    case 'work_ticket_review':
      return clip(workTicketReview(data), NOTIFICATION_TEXT_MAX);
    default:
      return null;
  }
}
