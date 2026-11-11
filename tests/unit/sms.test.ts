import { afterEach, describe, expect, it, vi } from 'vitest';

import { sendTextSchema } from '@/features/sms/schemas';
import { draftGreeting, draftOrderText } from '@/features/sms/templates';

vi.mock('server-only', () => ({}));

const ID = '3f2b8a9e-4c1d-4e6a-9b7f-1a2b3c4d5e6f';
const order = {
  orderNumber: 'ORD-1103',
  customer: 'Accurate Concrete',
  serviceDate: 'Nov 6',
  pourTime: '7:00 AM',
  siteAddress: '12 Main St',
};

describe('sendTextSchema', () => {
  it('accepts a valid text and trims it', () => {
    const parsed = sendTextSchema.parse({ jobId: ID, recipient: 'contact', recipientId: ID, body: '  Hello  ' });
    expect(parsed.body).toBe('Hello');
  });

  it('rejects an empty or too long message', () => {
    const base = { jobId: ID, recipient: 'operator', recipientId: ID };
    expect(sendTextSchema.safeParse({ ...base, body: '   ' }).success).toBe(false);
    expect(sendTextSchema.safeParse({ ...base, body: 'a'.repeat(1001) }).success).toBe(false);
  });

  it('rejects an unknown recipient kind', () => {
    expect(sendTextSchema.safeParse({ jobId: ID, recipient: 'supplier', recipientId: ID, body: 'Hi' }).success).toBe(false);
  });

  it('lets a customer be texted without an order', () => {
    expect(sendTextSchema.safeParse({ recipient: 'customer', recipientId: ID, body: 'Hi' }).success).toBe(true);
  });
});

describe('draftOrderText', () => {
  it('greets the contact by first name and gives the booking', () => {
    expect(draftOrderText('contact', 'Dave Smith', order)).toBe(
      'Hi Dave, your concrete pump (ORD-1103) is booked for Nov 6 at 7:00 AM at 12 Main St.',
    );
  });

  it('tells the operator the customer and the pour', () => {
    expect(draftOrderText('operator', 'Dave Smith', order)).toBe(
      'Hi Dave, ORD-1103 for Accurate Concrete: pour Nov 6 at 7:00 AM at 12 Main St.',
    );
  });

  it('copes with a missing name, time and address', () => {
    expect(draftOrderText('contact', '', { ...order, pourTime: '', siteAddress: '' })).toBe(
      'Hi, your concrete pump (ORD-1103) is booked for Nov 6.',
    );
  });
});

describe('draftGreeting', () => {
  it('starts with the first name, or just Hi', () => {
    expect(draftGreeting('Alex Morgan')).toBe('Hi Alex, ');
    expect(draftGreeting('')).toBe('Hi, ');
  });
});

describe('sendSms', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('only records the text when Twilio keys are missing', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', '');
    vi.stubEnv('TWILIO_FROM_NUMBER', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { sendSms } = await import('@/features/sms/server/twilio');
    const outcome = await sendSms('+12075550110', 'Hi');
    expect(outcome.status).toBe('dry_run');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports Twilio as queued with its message id', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', 'ACtest');
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'token');
    vi.stubEnv('TWILIO_API_KEY_SID', '');
    vi.stubEnv('TWILIO_API_KEY_SECRET', '');
    vi.stubEnv('TWILIO_FROM_NUMBER', '+17174825895');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sid: 'SM123' }) }));
    const { sendSms } = await import('@/features/sms/server/twilio');
    expect(await sendSms('+12075550110', 'Hi')).toMatchObject({ status: 'queued', providerSid: 'SM123' });
  });

  it('returns Twilio\'s reason when it refuses the text', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', 'ACtest');
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'token');
    vi.stubEnv('TWILIO_API_KEY_SID', '');
    vi.stubEnv('TWILIO_API_KEY_SECRET', '');
    vi.stubEnv('TWILIO_FROM_NUMBER', '+17174825895');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ code: 21608, message: 'Unverified number' }) }),
    );
    const { sendSms } = await import('@/features/sms/server/twilio');
    expect(await sendSms('+12075550110', 'Hi')).toMatchObject({
      status: 'failed',
      errorCode: '21608',
      errorMessage: 'Unverified number',
    });
  });
});
