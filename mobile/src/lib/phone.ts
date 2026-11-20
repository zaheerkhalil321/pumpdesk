/**
 * Phone numbers for the sign-in screen and display.
 * Countries the app accepts: the US (the client's operators) and Pakistan (team testing).
 */

export type CountryCode = 'US' | 'PK';

export interface Country {
  code: CountryCode;
  /** Calling code without "+", e.g. "1". */
  dial: string;
  name: string;
  /** Digits after the calling code. */
  nationalLength: number;
  placeholder: string;
}

export const COUNTRIES: Record<CountryCode, Country> = {
  US: { code: 'US', dial: '1', name: 'United States', nationalLength: 10, placeholder: '(555) 123-4567' },
  PK: { code: 'PK', dial: '92', name: 'Pakistan', nationalLength: 10, placeholder: '300 1234567' },
};

export const COUNTRY_LIST: Country[] = [COUNTRIES.US, COUNTRIES.PK];

/**
 * Clean digits from any input string.
 */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * The national digits of what the person typed: drops a typed calling code
 * ("1..." in the US, "92..." in Pakistan) or Pakistan's trunk "0" ("0300...").
 */
export function nationalDigits(value: string, country: CountryCode = 'US'): string {
  const { dial, nationalLength } = COUNTRIES[country];
  let digits = extractDigits(value);
  if (digits.length > nationalLength && digits.startsWith(dial)) digits = digits.slice(dial.length);
  if (country === 'PK' && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, nationalLength);
}

/**
 * Format national digits as the person types: "(207) 555-0168" (US), "300 1234567" (PK).
 */
export function formatNational(value: string, country: CountryCode = 'US'): string {
  const d = nationalDigits(value, country);
  if (d.length === 0) return '';
  if (country === 'PK') {
    return d.length <= 3 ? d : `${d.slice(0, 3)} ${d.slice(3)}`;
  }
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
}

/** Kept for existing callers: US formatting. */
export function formatUsPhone(value: string): string {
  return formatNational(value, 'US');
}

/**
 * Whether the typed number is complete for the chosen country.
 */
export function isValidPhone(value: string, country: CountryCode = 'US'): boolean {
  const d = nationalDigits(value, country);
  if (d.length !== COUNTRIES[country].nationalLength) return false;
  // Pakistani mobile numbers start with 3 (e.g. 300, 321, 345).
  if (country === 'PK') return d.startsWith('3');
  return true;
}

/** Kept for existing callers: US check. */
export function isValidUsPhone(phone: string): boolean {
  return isValidPhone(phone, 'US');
}

/**
 * Format into E.164 ("+12075550168", "+923001234567").
 * A value that already starts with "+" is kept as it is (digits only).
 */
export function toE164(phone: string, country: CountryCode = 'US'): string {
  if (phone.trim().startsWith('+')) {
    return `+${extractDigits(phone)}`;
  }
  return `+${COUNTRIES[country].dial}${nationalDigits(phone, country)}`;
}

/** Which of our countries an E.164 number belongs to (null when it is another one). */
export function countryOf(e164: string): CountryCode | null {
  const digits = extractDigits(e164);
  if (digits.startsWith('92') && digits.length === 12) return 'PK';
  if (digits.startsWith('1') && digits.length === 11) return 'US';
  return null;
}

/**
 * Show a stored E.164 number: "(207) 555-0168" (US), "+92 300 1234567" (PK).
 */
export function formatPhoneForDisplay(e164: string): string {
  const country = countryOf(e164);
  if (country === 'US') return formatNational(e164, 'US');
  if (country === 'PK') return `+92 ${formatNational(e164, 'PK')}`;
  return e164;
}

/**
 * Mask a phone number for the verification screen:
 * (207) 555-0168 -> (207) •••-0168, +92 300 1234567 -> +92 300 •••4567
 */
export function maskPhoneNumber(phone: string): string {
  const country = countryOf(phone.trim().startsWith('+') ? phone : toE164(phone));
  const digits = extractDigits(phone);
  if (country === 'PK') {
    const d = digits.slice(-10);
    return `+92 ${d.slice(0, 3)} •••${d.slice(6)}`;
  }
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  if (ten.length === 10) {
    return `(${ten.slice(0, 3)}) •••-${ten.slice(6)}`;
  }
  return phone;
}
