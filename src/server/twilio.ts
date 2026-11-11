import 'server-only';

export interface TwilioReply {
  sid?: string;
  code?: number;
  message?: string;
}

export interface TwilioOutcome {
  status: 'queued' | 'failed' | 'dry_run';
  providerSid: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}

/** The Twilio keys, or null when they are not set (local development without a Twilio account). */
function twilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKeySid = process.env.TWILIO_API_KEY_SID;
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
  const from = process.env.TWILIO_FROM_NUMBER;

  // A restricted API key is preferred; the account's auth token is the fallback.
  const user = apiKeySid && apiKeySecret ? apiKeySid : accountSid;
  const password = apiKeySid && apiKeySecret ? apiKeySecret : process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !user || !password || !from) return null;
  return { accountSid, user, password, from };
}

/**
 * Creates a Twilio resource ("Messages" or "Calls"). With no keys set nothing is sent and the
 * outcome is `dry_run`, so the whole flow can be tried without a Twilio account.
 */
export async function twilioCreate(
  resource: 'Messages' | 'Calls',
  params: (from: string) => Record<string, string>,
): Promise<TwilioOutcome> {
  const config = twilioConfig();
  if (!config) return { status: 'dry_run', providerSid: null, errorCode: null, errorMessage: null };

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/${resource}.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.user}:${config.password}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params(config.from)),
      cache: 'no-store',
    },
  );
  const reply = (await response.json().catch(() => ({}))) as TwilioReply;

  if (!response.ok || !reply.sid) {
    return {
      status: 'failed',
      providerSid: null,
      errorCode: reply.code ? String(reply.code) : String(response.status),
      errorMessage: (reply.message ?? 'Twilio did not accept the request').slice(0, 300),
    };
  }
  return { status: 'queued', providerSid: reply.sid, errorCode: null, errorMessage: null };
}
