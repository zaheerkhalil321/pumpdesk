/**
 * A short branch code from its name, not already taken: "Warren HQ" gives "WH", "Portland" gives "POR".
 * A taken code gets a number added ("POR2"). Codes are unique per company, inactive branches included.
 */
export function suggestBranchCode(name: string, taken: readonly string[]): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  const base =
    (words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 3) : (words[0] ?? '').slice(0, 3)) || 'BR';
  const used = new Set(taken.map((c) => c.toUpperCase()));
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const code = `${base}${n}`;
    if (!used.has(code)) return code;
  }
}

/** Up to 2 letters for a company badge: "Midcoast Concrete Pumping" gives "MC". */
export function monogramOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? 'PD').slice(0, 2)).toUpperCase();
}
