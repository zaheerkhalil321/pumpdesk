import 'server-only';

import type { SmsStatus } from '@/features/sms/types';

export interface SmsOutcome {
  status: SmsStatus;
  providerSid: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

interface TwilioReply {
  sid?: string;
  code?: number;
  message?: string;
}

/**
 * Sends one text through Twilio's REST API. With no Twilio keys set (local development) nothing
 * is sent and the text is only recorded, so the whole flow can be tried without a Twilio account.
 */
export async function sendSms(to: string, body: string): Promise<SmsOutcome> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const from = process.env.TWILIO_FROM_NUMBER;

  const user = apiKeySid && apiKeySecret ? apiKeySid : accountSid;
  const password = apiKeySid && apiKeySecret ? apiKeySecret : authToken;
  if (!accountSid || !user || !password || !from) {
    return { status: 'dry_run', providerSid: null, errorCode: null, errorMessage: null };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
    cache: 'no-store',
  });
  const reply = (await response.json().catch(() => ({}))) as TwilioReply;

  if (!response.ok || !reply.sid) {
    return {
      status: 'failed',
      providerSid: null,
      errorCode: reply.code ? String(reply.code) : String(response.status),
      errorMessage: (reply.message ?? 'Twilio did not accept the text').slice(0, 300),
    };
  }
  return { status: 'queued', providerSid: reply.sid, errorCode: null, errorMessage: null };
}
