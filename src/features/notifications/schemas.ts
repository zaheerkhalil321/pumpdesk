import { z } from 'zod';

import { NOTIFICATION_EVENTS } from '@/features/notifications/events';

const event = z.enum(NOTIFICATION_EVENTS);

export const setNotificationRuleSchema = z.object({ event, enabled: z.boolean() });

export const setCustomerNotificationPrefSchema = z.object({
  customerId: z.string().uuid(),
  event,
  enabled: z.boolean(),
});

/** What the sender returns for each claimed row (see claim_notification_deliveries). */
export const claimedDeliverySchema = z.object({
  id: z.string().uuid(),
  event: z.enum(NOTIFICATION_EVENTS),
  company_id: z.string().uuid(),
  job_id: z.string().uuid(),
  contact_id: z.string().uuid().nullable(),
  customer_id: z.string().uuid().nullable(),
  to_phone: z.string().nullable(),
  attempts: z.number(),
  company_name: z.string(),
  job_number: z.string(),
  booking_status: z.string(),
  dispatch_status: z.string(),
  timezone: z.string(),
  scheduled_start: z.string(),
  site_label: z.string(),
  customer_name: z.string(),
  recipient_name: z.string(),
  current_phone: z.string().nullable(),
  rule_enabled: z.boolean(),
  pref_enabled: z.boolean(),
  operator_name: z.string().nullable(),
  operator_phone: z.string().nullable(),
  pump_code: z.string().nullable(),
  yards_pumped: z.coerce.number().nullable(),
  pump_hours: z.coerce.number().nullable(),
});

export type ClaimedDelivery = z.infer<typeof claimedDeliverySchema>;
