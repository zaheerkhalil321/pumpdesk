/**
 * Clean digits from any input string.
 */
export function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Format a 10-digit US phone string into (XXX) XXX-XXXX format progressively.
 */
export function formatUsPhone(value: string): string {
  const digits = extractDigits(value);
  const trimmed = digits.startsWith('1') && digits.length > 10 ? digits.slice(1) : digits;
  const clean = trimmed.slice(0, 10);

  if (clean.length === 0) return '';
  if (clean.length <= 3) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
  return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
}

/**
 * Format raw phone into E.164 (+1XXXXXXXXXX).
 */
export function toE164(phone: string): string {
  const digits = extractDigits(phone);
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (phone.startsWith('+')) {
    return phone;
  }
  return `+${digits}`;
}

/**
 * Mask a phone number for display on the verification screen:
 * (207) 555-0168 -> (207) •••-0168
 */
export function maskPhoneNumber(phone: string): string {
  const digits = extractDigits(phone);
  const ten = digits.length >= 10 ? digits.slice(-10) : digits;
  if (ten.length === 10) {
    return `(${ten.slice(0, 3)}) •••-${ten.slice(6)}`;
  }
  return phone;
}

/**
 * Validate whether a phone number is a valid 10-digit US phone number.
 */
export function isValidUsPhone(phone: string): boolean {
  const digits = extractDigits(phone);
  const ten = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
  return ten.length === 10;
}
