/** Address columns shared by branches and companies. */
export interface AddressParts {
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
}

/**
 * One line Google can route from, like "50 Niilo Hill Rd, Warren, ME 04864".
 * Null without a street or a town: a state alone ("ME") is not a place to drive from.
 */
export function routableAddress(parts: AddressParts | null | undefined): string | null {
  if (!parts) return null;
  const street = parts.address_line_1?.trim();
  const city = parts.city?.trim();
  if (!street && !city) return null;
  const stateZip = [parts.state?.trim(), parts.postal_code?.trim()].filter(Boolean).join(' ');
  return [street, city, stateZip].filter(Boolean).join(', ');
}
