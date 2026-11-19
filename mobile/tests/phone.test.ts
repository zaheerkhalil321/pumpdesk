import {
  extractDigits,
  formatUsPhone,
  toE164,
  maskPhoneNumber,
  isValidUsPhone,
} from '../src/lib/phone';

describe('Phone Utilities', () => {
  it('extracts digits correctly', () => {
    expect(extractDigits('(207) 555-0168')).toBe('2075550168');
    expect(extractDigits('+1 (207) 555-0168')).toBe('12075550168');
    expect(extractDigits('abc 123 - 456')).toBe('123456');
  });

  it('formats US phone numbers progressively', () => {
    expect(formatUsPhone('2')).toBe('(2');
    expect(formatUsPhone('207')).toBe('(207');
    expect(formatUsPhone('207555')).toBe('(207) 555');
    expect(formatUsPhone('2075550168')).toBe('(207) 555-0168');
  });

  it('converts to E.164', () => {
    expect(toE164('2075550168')).toBe('+12075550168');
    expect(toE164('(207) 555-0168')).toBe('+12075550168');
    expect(toE164('12075550168')).toBe('+12075550168');
  });

  it('masks phone numbers for verification screen', () => {
    expect(maskPhoneNumber('2075550168')).toBe('(207) •••-0168');
    expect(maskPhoneNumber('+12075550168')).toBe('(207) •••-0168');
  });

  it('validates 10-digit US phone numbers', () => {
    expect(isValidUsPhone('2075550168')).toBe(true);
    expect(isValidUsPhone('12075550168')).toBe(true);
    expect(isValidUsPhone('207555')).toBe(false);
    expect(isValidUsPhone('0000000000')).toBe(true);
  });
});
