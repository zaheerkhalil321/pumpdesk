import { describe, expect, it } from 'vitest';

import { renderNotificationText, NOTIFICATION_TEXT_MAX, type NotificationTextData } from '@/features/notifications/templates';
import { NOTIFICATION_EVENTS, NOTIFICATION_EVENT_INFO } from '@/features/notifications/events';

const data: NotificationTextData = {
  recipientName: 'Dave',
  companyName: 'Midcoast Concrete Pumping',
  jobNumber: 'ORD-1524',
  timezone: 'America/New_York',
  scheduledStart: '2026-11-19T12:00:00Z',
  siteLabel: '24 Main St, Rockland',
  operatorName: 'Rob Black',
  operatorPhone: '+12075550100',
  yardsPumped: 36.5,
  pumpHours: 2.2,
};

describe('notification texts', () => {
  it('writes the order confirmation in the order timezone', () => {
    expect(renderNotificationText('order_confirmation', data)).toBe(
      'Hi Dave, your concrete pump for ORD-1524 is confirmed for Thu Nov 19 at 7:00 AM, 24 Main St, Rockland. - Midcoast Concrete Pumping',
    );
  });

  it('uses another timezone for the same moment', () => {
    expect(renderNotificationText('order_confirmation', { ...data, timezone: 'America/Chicago' })).toContain('at 6:00 AM');
  });

  it('gives the operator name and phone', () => {
    expect(renderNotificationText('operator_details', data)).toBe(
      'Hi Dave, Rob Black will run your pump for ORD-1524. Operator phone (207) 555-0100. - Midcoast Concrete Pumping',
    );
  });

  it('leaves the phone out when the operator has none', () => {
    expect(renderNotificationText('operator_details', { ...data, operatorPhone: null })).not.toContain('phone');
  });

  it('says the pump is on its way', () => {
    expect(renderNotificationText('pump_en_route', data)).toBe(
      'Hi Dave, the pump for ORD-1524 has left the yard and is on its way to 24 Main St, Rockland. - Midcoast Concrete Pumping',
    );
  });

  it('summarizes the pour', () => {
    expect(renderNotificationText('work_ticket_review', data)).toBe(
      'Hi Dave, the pour for ORD-1524 is done: 36.5 yd³ pumped, 2.2 pump hours. Thank you! - Midcoast Concrete Pumping',
    );
  });

  it('skips missing numbers in the pour summary', () => {
    const text = renderNotificationText('work_ticket_review', { ...data, pumpHours: null, yardsPumped: null });
    expect(text).toBe('Hi Dave, the pour for ORD-1524 is done. Thank you! - Midcoast Concrete Pumping');
  });

  it('never goes over the length limit', () => {
    const long = { ...data, siteLabel: 'x'.repeat(500), companyName: 'y'.repeat(200) };
    for (const event of NOTIFICATION_EVENTS) {
      const text = renderNotificationText(event, long);
      if (text) expect(text.length).toBeLessThanOrEqual(NOTIFICATION_TEXT_MAX);
    }
  });

  it('has no text for the two messages that are not sent yet', () => {
    expect(renderNotificationText('pre_work_authorization', data)).toBeNull();
    expect(renderNotificationText('missing_job_details', data)).toBeNull();
    expect(NOTIFICATION_EVENTS.filter((e) => NOTIFICATION_EVENT_INFO[e].automatic)).toHaveLength(4);
  });
});
