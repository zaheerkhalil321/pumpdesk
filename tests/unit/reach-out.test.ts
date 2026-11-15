import { describe, expect, it } from 'vitest';

import { callHref, textHref } from '@/lib/reach-out';

describe('callHref', () => {
  it('dials a US number in E.164', () => {
    expect(callHref('(207) 230-4900')).toBe('tel:+12072304900');
  });

  it('skips a number that cannot be dialed', () => {
    expect(callHref('555')).toBeNull();
  });
});

describe('textHref', () => {
  it('fills in the message', () => {
    expect(textHref('+12072304900', 'Hi Dave, pour at 7:00 AM & bring hose')).toBe(
      'sms:+12072304900?&body=Hi%20Dave%2C%20pour%20at%207%3A00%20AM%20%26%20bring%20hose',
    );
  });

  it('leaves the message out when there is none', () => {
    expect(textHref('2072304900', '')).toBe('sms:+12072304900');
  });

  it('skips a number that cannot be texted', () => {
    expect(textHref('', 'Hi')).toBeNull();
  });
});
