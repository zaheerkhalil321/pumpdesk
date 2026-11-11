import { afterEach, describe, expect, it, vi } from 'vitest';

import { placeCallSchema } from '@/features/calls/schemas';
import { toDialable } from '@/lib/phone';

vi.mock('server-only', () => ({}));

const ID = '3f2b8a9e-4c1d-4e6a-9b7f-1a2b3c4d5e6f';

describe('toDialable', () => {
  it('turns a US number in any format into E.164', () => {
    expect(toDialable('(207) 555-0110')).toBe('+12075550110');
    expect(toDialable('1 207 555 0110')).toBe('+12075550110');
  });

  it('keeps an international number that starts with +', () => {
    expect(toDialable('+92 300 1234567')).toBe('+923001234567');
  });

  it('rejects numbers that are too short, too long or not numbers', () => {
    expect(toDialable('')).toBeNull();
    expect(toDialable('12345')).toBeNull();
    expect(toDialable('+1234')).toBeNull();
    expect(toDialable('+1234567890123456')).toBeNull();
    expect(toDialable('call me')).toBeNull();
  });
});

describe('placeCallSchema', () => {
  const base = { recipient: 'contact', recipientId: ID, yourPhone: '(207) 555-0110' };

  it('accepts a call with or without an order', () => {
    expect(placeCallSchema.safeParse(base).success).toBe(true);
    expect(placeCallSchema.safeParse({ ...base, jobId: ID }).success).toBe(true);
  });

  it('rejects a bad dispatcher phone or an unknown recipient kind', () => {
    expect(placeCallSchema.safeParse({ ...base, yourPhone: '123' }).success).toBe(false);
    expect(placeCallSchema.safeParse({ ...base, recipient: 'supplier' }).success).toBe(false);
  });
});

describe('placeBridgedCall', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('only records the call when Twilio keys are missing', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', '');
    vi.stubEnv('TWILIO_FROM_NUMBER', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { placeBridgedCall } = await import('@/features/calls/server/twilio');
    expect((await placeBridgedCall('+12075550110', '+12075550111')).status).toBe('dry_run');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rings the dispatcher first, then dials the other person from the company number', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', 'ACtest');
    vi.stubEnv('TWILIO_AUTH_TOKEN', 'token');
    vi.stubEnv('TWILIO_API_KEY_SID', '');
    vi.stubEnv('TWILIO_API_KEY_SECRET', '');
    vi.stubEnv('TWILIO_FROM_NUMBER', '+17174825895');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ sid: 'CA123' }) });
    vi.stubGlobal('fetch', fetchMock);
    const { placeBridgedCall } = await import('@/features/calls/server/twilio');

    expect(await placeBridgedCall('+12075550110', '+12075550111')).toMatchObject({
      status: 'queued',
      providerSid: 'CA123',
    });
    const [url, init] = fetchMock.mock.calls[0] as [string, { body: URLSearchParams }];
    expect(url).toContain('/Accounts/ACtest/Calls.json');
    expect(init.body.get('To')).toBe('+12075550110');
    expect(init.body.get('From')).toBe('+17174825895');
    expect(init.body.get('Twiml')).toContain('<Dial callerId="+17174825895">+12075550111</Dial>');
  });
});
