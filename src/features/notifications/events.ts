export const NOTIFICATION_EVENTS = [
  'order_confirmation',
  'operator_details',
  'pump_en_route',
  'pre_work_authorization',
  'work_ticket_review',
  'missing_job_details',
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export interface NotificationEventInfo {
  code: NotificationEvent;
  label: string;
  /** What the message is, in a sentence, for the settings screen. */
  info: string;
  /** When it goes out. */
  when: string;
  /** Sent without anyone pressing a button. The other two are only saved for now. */
  automatic: boolean;
  /** On when the company has not chosen. */
  defaultEnabled: boolean;
}

export const NOTIFICATION_EVENT_INFO: Record<NotificationEvent, NotificationEventInfo> = {
  order_confirmation: {
    code: 'order_confirmation',
    label: 'Order confirmation',
    info: 'Texts the job contact when an order is confirmed.',
    when: 'When confirmed',
    automatic: true,
    defaultEnabled: true,
  },
  operator_details: {
    code: 'operator_details',
    label: 'Operator details',
    info: 'Gives the job contact the operator name and phone number.',
    when: 'When dispatched',
    automatic: true,
    defaultEnabled: true,
  },
  pump_en_route: {
    code: 'pump_en_route',
    label: 'Pump en route',
    info: 'Lets the job contact know the pump has left the yard.',
    when: 'When the operator leaves the yard',
    automatic: true,
    defaultEnabled: true,
  },
  pre_work_authorization: {
    code: 'pre_work_authorization',
    label: 'Pre-work authorization',
    info: 'Requests digital sign-off on terms prior to boom setup.',
    when: 'When requested',
    automatic: false,
    defaultEnabled: false,
  },
  work_ticket_review: {
    code: 'work_ticket_review',
    label: 'Work ticket review',
    info: 'Sends a short summary of the pour after the ticket is submitted.',
    when: 'After ticket submission',
    automatic: true,
    defaultEnabled: true,
  },
  missing_job_details: {
    code: 'missing_job_details',
    label: 'Missing job details',
    info: 'Automated nudge for mix design or gate access code.',
    when: 'When requested',
    automatic: false,
    defaultEnabled: false,
  },
};

export const NOTIFICATION_EVENT_LIST: NotificationEventInfo[] = NOTIFICATION_EVENTS.map(
  (code) => NOTIFICATION_EVENT_INFO[code],
);

export function isNotificationEvent(value: string): value is NotificationEvent {
  return (NOTIFICATION_EVENTS as readonly string[]).includes(value);
}

/** One row on the customer page: what the customer chose, and what actually applies. */
export interface CustomerNotificationRow extends NotificationEventInfo {
  /** The company turned this message off, so nothing is sent whatever the customer chose. */
  companyEnabled: boolean;
  /** The customer's own choice, or null when it follows the company. */
  customerChoice: boolean | null;
  /** What happens: company on and the customer not off. */
  effective: boolean;
}

export type NotificationRuleRow = NotificationEventInfo & { enabled: boolean };

export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'skipped';

export interface OrderDelivery {
  id: string;
  event: NotificationEvent;
  label: string;
  recipient: string;
  phone: string | null;
  status: DeliveryStatus;
  skipReason: string | null;
  at: string;
  /** The text was only logged (no Twilio keys), never sent. */
  dryRun: boolean;
}
