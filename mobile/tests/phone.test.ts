import {
  extractDigits,
  formatUsPhone,
  toE164,
  maskPhoneNumber,
  isValidUsPhone,
  isValidPhone,
  formatNational,
  formatPhoneForDisplay,
  countryOf,
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

  describe('Pakistan (+92)', () => {
    it('formats as the person types and drops a typed 0 or 92', () => {
      expect(formatNational('300', 'PK')).toBe('300');
      expect(formatNational('3001234567', 'PK')).toBe('300 1234567');
      expect(formatNational('03001234567', 'PK')).toBe('300 1234567');
      expect(formatNational('923001234567', 'PK')).toBe('300 1234567');
    });

    it('validates 10-digit mobile numbers starting with 3', () => {
      expect(isValidPhone('300 1234567', 'PK')).toBe(true);
      expect(isValidPhone('0300 1234567', 'PK')).toBe(true);
      expect(isValidPhone('300 12345', 'PK')).toBe(false);
      expect(isValidPhone('4001234567', 'PK')).toBe(false);
    });

    it('converts to E.164 and back for display', () => {
      expect(toE164('0300 1234567', 'PK')).toBe('+923001234567');
      expect(toE164('+923001234567')).toBe('+923001234567');
      expect(countryOf('+923001234567')).toBe('PK');
      expect(countryOf('+12075550168')).toBe('US');
      expect(formatPhoneForDisplay('+923001234567')).toBe('+92 300 1234567');
      expect(formatPhoneForDisplay('+12075550168')).toBe('(207) 555-0168');
    });

    it('masks for the verification screen', () => {
      expect(maskPhoneNumber('+923001234567')).toBe('+92 300 •••4567');
    });
  });
});
