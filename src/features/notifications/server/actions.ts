'use server';

import { revalidatePath } from 'next/cache';

import { authedAction } from '@/server/action';
import {
  setCustomerNotificationPrefSchema,
  setNotificationRuleSchema,
} from '@/features/notifications/schemas';

const RULE_EDITORS = ['owner', 'admin'] as const;
const PREF_EDITORS = ['owner', 'admin', 'dispatcher', 'office'] as const;

/** Turns one of the company's customer messages on or off. */
export const setNotificationRule = authedAction({
  schema: setNotificationRuleSchema,
  roles: RULE_EDITORS,
  run: async ({ input, session, supabase }) => {
    // Update first, insert when there is no row yet. (The tables only let a signed-in user change "enabled",
    // which an upsert would not stay within.)
    const updated = await supabase
      .from('notification_rules')
      .update({ enabled: input.enabled })
      .eq('company_id', session.companyId)
      .eq('event', input.event)
      .select('event');
    if (updated.error) throw updated.error;
    if (updated.data.length === 0) {
      const { error } = await supabase
        .from('notification_rules')
        .insert({ company_id: session.companyId, event: input.event, enabled: input.enabled });
      if (error) throw error;
    }
    revalidatePath('/settings');
    revalidatePath('/customers/[id]', 'page');
    return { event: input.event, enabled: input.enabled };
  },
});

/** Turns one message on or off for one customer. Without a choice the customer follows the company. */
export const setCustomerNotificationPref = authedAction({
  schema: setCustomerNotificationPrefSchema,
  roles: PREF_EDITORS,
  run: async ({ input, session, supabase }) => {
    const updated = await supabase
      .from('customer_notification_prefs')
      .update({ enabled: input.enabled })
      .eq('customer_id', input.customerId)
      .eq('event', input.event)
      .select('event');
    if (updated.error) throw updated.error;
    if (updated.data.length === 0) {
      const { error } = await supabase.from('customer_notification_prefs').insert({
        company_id: session.companyId,
        customer_id: input.customerId,
        event: input.event,
        enabled: input.enabled,
      });
      if (error) throw error;
    }
    revalidatePath(`/customers/${input.customerId}`);
    return { event: input.event, enabled: input.enabled };
  },
});
