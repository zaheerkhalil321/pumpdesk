import 'server-only';

import { formatInTimeZone } from 'date-fns-tz';

import { createClient } from '@/server/supabase';
import {
  NOTIFICATION_EVENT_INFO,
  NOTIFICATION_EVENT_LIST,
  isNotificationEvent,
  type CustomerNotificationRow,
  type DeliveryStatus,
  type NotificationRuleRow,
  type OrderDelivery,
} from '@/features/notifications/events';

/** The company's rules for the six messages, with the default where nothing is saved. */
export async function listNotificationRules(): Promise<NotificationRuleRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('notification_rules').select('event, enabled');
  if (error) throw error;
  const saved = new Map((data ?? []).map((row) => [row.event, row.enabled]));
  return NOTIFICATION_EVENT_LIST.map((info) => ({
    ...info,
    enabled: saved.get(info.code) ?? info.defaultEnabled,
  }));
}

/** One customer's six messages: the company rule, the customer's own choice, and what applies. */
export async function listCustomerNotificationRows(customerId: string): Promise<CustomerNotificationRow[]> {
  const supabase = await createClient();
  const [rules, prefs] = await Promise.all([
    listNotificationRules(),
    supabase.from('customer_notification_prefs').select('event, enabled').eq('customer_id', customerId),
  ]);
  if (prefs.error) throw prefs.error;
  const choices = new Map((prefs.data ?? []).map((row) => [row.event, row.enabled]));
  return rules.map((rule) => {
    const customerChoice = choices.get(rule.code) ?? null;
    return {
      ...NOTIFICATION_EVENT_INFO[rule.code],
      companyEnabled: rule.enabled,
      customerChoice,
      effective: rule.enabled && customerChoice !== false,
    };
  });
}

/** The automatic texts for one order, newest first. Read only. */
export async function listOrderDeliveries(jobNumber: string): Promise<OrderDelivery[]> {
  const supabase = await createClient();
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, timezone')
    .eq('job_number', jobNumber)
    .maybeSingle();
  if (jobError) throw jobError;
  if (!job) return [];
  const jobId = job.id;
  const timezone = job.timezone;
  const { data, error } = await supabase
    .from('notification_deliveries')
    .select(
      'id, event, status, skip_reason, to_phone, created_at, processed_at, contact:contacts(first_name, last_name), customer:customers(business_name), sms:sms_messages(status)',
    )
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).flatMap((row) => {
    if (!isNotificationEvent(row.event)) return [];
    const contact = row.contact ? `${row.contact.first_name} ${row.contact.last_name ?? ''}`.trim() : null;
    const when = row.processed_at ?? row.created_at;
    return [
      {
        id: row.id,
        event: row.event,
        label: NOTIFICATION_EVENT_INFO[row.event].label,
        recipient: contact ?? row.customer?.business_name ?? 'Customer',
        phone: row.to_phone,
        status: row.status as DeliveryStatus,
        skipReason: row.skip_reason,
        at: formatInTimeZone(when, timezone, 'MMM d, h:mm a'),
        dryRun: row.sms?.status === 'dry_run',
      },
    ];
  });
}
