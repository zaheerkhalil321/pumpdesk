/** US phone helpers. The database stores E.164 (+12075550101); the UI shows (207) 555-0101. */

/** Converts any common US input to E.164, or null when it isn't a valid 10-digit US number. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  if (national[0] === '0' || national[0] === '1') return null;
  return `+1${national}`;
}

/** Formats an E.164 US number as (207) 555-0101. Anything else is returned unchanged. */
export function formatE164(e164: string | null | undefined): string {
  if (!e164) return '';
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  if (!match) return e164;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}
