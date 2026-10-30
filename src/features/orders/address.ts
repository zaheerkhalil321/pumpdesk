const US_STATES = new Set(
  'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' '),
);

export interface ParsedAddress {
  /** Null when only a city and state were given. */
  addressLine1: string | null;
  city: string;
  state: string;
  postalCode: string | null;
}

/**
 * Splits "123 Main St, Portland, ME 04101, USA" (the Google format, with or without ZIP and
 * country) into its parts. A city and state alone ("San Francisco, CA, USA") is fine too: a job
 * site only needs a town. Returns null when there is no city and state to read, such as cross
 * streets or a single word, because a saved job site needs both.
 */
export function parseUsAddress(text: string): ParsedAddress | null {
  const parts = text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (/^(usa|us|united states)$/i.test(parts[parts.length - 1] ?? '')) parts.pop();
  if (parts.length < 2) return null;

  const region = /^([A-Za-z]{2})(?:\s+(\d{5})(?:-\d{4})?)?$/.exec(parts[parts.length - 1]);
  if (!region) return null;
  const state = region[1].toUpperCase();
  if (!US_STATES.has(state)) return null;

  const city = parts[parts.length - 2];
  if (!city) return null;
  const addressLine1 = parts.slice(0, -2).join(', ');
  return { addressLine1: addressLine1 || null, city, state, postalCode: region[2] ?? null };
}
