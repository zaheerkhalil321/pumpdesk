import 'server-only';

import { createAdminClient } from '@/server/supabase-admin';
import { sendSms } from '@/features/sms/server/twilio';
import { renderNotificationText } from '@/features/notifications/templates';
import { claimedDeliverySchema, type ClaimedDelivery } from '@/features/notifications/schemas';

export interface ProcessCounts {
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
}

type Admin = NonNullable<ReturnType<typeof createAdminClient>>;
type Outcome = { status: 'sent' | 'failed' | 'skipped'; smsId: string | null; reason: string | null };

/** Why a claimed text must not go out now, or null when every check still passes. */
function skipReason(row: ClaimedDelivery): string | null {
  if (row.booking_status === 'cancelled') return 'order_cancelled';
  if (!row.rule_enabled) return 'rule_off';
  if (!row.pref_enabled) return 'customer_off';
  if (!row.current_phone || !row.to_phone) return 'no_phone';
  if (row.event === 'operator_details' && !row.operator_name) return 'no_operator';
  return null;
}

async function sendOne(admin: Admin, row: ClaimedDelivery): Promise<Outcome> {
  const reason = skipReason(row);
  if (reason) return { status: 'skipped', smsId: null, reason };

  const body = renderNotificationText(row.event, {
    recipientName: row.recipient_name,
    companyName: row.company_name,
    jobNumber: row.job_number,
    timezone: row.timezone,
    scheduledStart: row.scheduled_start,
    siteLabel: row.site_label,
    operatorName: row.operator_name,
    operatorPhone: row.operator_phone,
    yardsPumped: row.yards_pumped,
    pumpHours: row.pump_hours,
  });
  if (!body) return { status: 'skipped', smsId: null, reason: 'not_automatic' };

  // The number stored when the text was queued is the one used, after the check above that it still exists.
  const to = row.current_phone as string;
  const outcome = await sendSms(to, body);

  const { data: sms, error } = await admin
    .from('sms_messages')
    .insert({
      company_id: row.company_id,
      job_id: row.job_id,
      contact_id: row.contact_id,
      customer_id: row.contact_id ? null : row.customer_id,
      recipient_kind: row.contact_id ? 'contact' : 'customer',
      to_phone: to,
      body,
      status: outcome.status,
      provider_sid: outcome.providerSid,
      error_code: outcome.errorCode,
      error_message: outcome.errorMessage,
      notification_event: row.event,
    })
    .select('id')
    .single();
  const smsId = error ? null : sms.id;

  // A dry run (no Twilio keys) counts as done: the log row says dry_run and nothing was sent.
  if (outcome.status === 'failed') {
    return { status: 'failed', smsId, reason: outcome.errorMessage ?? outcome.errorCode ?? 'send_failed' };
  }
  return { status: 'sent', smsId, reason: null };
}

/**
 * Sends the queued customer texts. Takes due rows, checks again that each is still wanted (order not
 * cancelled, rule and customer choice still on, phone still there), sends through Twilio, writes the text
 * to sms_messages and closes the row. Safe to run at any time and from several places at once: rows are
 * claimed with a lock, so a text never goes twice.
 */
export async function processNotificationDeliveries(limit = 25): Promise<ProcessCounts> {
  const counts: ProcessCounts = { claimed: 0, sent: 0, failed: 0, skipped: 0 };
  const admin = createAdminClient();
  if (!admin) return counts;

  const { data, error } = await admin.rpc('claim_notification_deliveries', { p_limit: limit });
  if (error) throw error;
  const parsed = claimedDeliverySchema.array().safeParse(data ?? []);
  if (!parsed.success) throw new Error('Unexpected answer from claim_notification_deliveries');

  for (const row of parsed.data) {
    counts.claimed += 1;
    let outcome: Outcome;
    try {
      outcome = await sendOne(admin, row);
    } catch (caught) {
      outcome = {
        status: 'failed',
        smsId: null,
        reason: caught instanceof Error ? caught.message.slice(0, 200) : 'send_failed',
      };
    }
    counts[outcome.status] += 1;
    const { error: finishError } = await admin.rpc('finish_notification_delivery', {
      p_id: row.id,
      p_status: outcome.status,
      p_sms_message_id: outcome.smsId ?? undefined,
      p_reason: outcome.reason ?? undefined,
    });
    if (finishError) throw finishError;
  }
  return counts;
}
