/** Pure display helpers for pumps. */

/** "01 · 34M", "02 · 28M" or "04 · Line", from the unit number and boom size. */
export function getPumpDisplayName(pump: {
  unitNumber: string;
  boomSize?: number;
  type?: string;
  boomLength?: string;
}): string {
  if (!pump) return '';
  const rawUnit = pump.unitNumber || '';
  const cleanUnit = rawUnit.includes('·') ? rawUnit.split('·')[0].trim() : rawUnit.trim();

  if (pump.boomSize && Number(pump.boomSize) > 0) {
    return `${cleanUnit} · ${pump.boomSize}M`;
  }
  const match = pump.boomLength?.match(/(\d+)\s*M/i);
  if (match) {
    return `${cleanUnit} · ${match[1]}M`;
  }
  if (pump.type === 'line_pump' || pump.boomLength?.toLowerCase().includes('line')) {
    return `${cleanUnit} · Line`;
  }
  return cleanUnit;
}

/** "$195 / hr" */
export function formatHourlyRate(rate: number | string | undefined | null): string {
  if (rate === undefined || rate === null || rate === '') return '$0 / hr';
  if (typeof rate === 'number') return `$${rate} / hr`;
  const clean = String(rate).replace(/[^0-9.]/g, '');
  return clean ? `$${clean} / hr` : '$0 / hr';
}

export function parseHourlyRate(rate: number | string | undefined | null): number {
  if (typeof rate === 'number') return rate;
  if (!rate) return 0;
  const num = parseFloat(String(rate).replace(/[^0-9.]/g, ''));
  return Number.isNaN(num) ? 0 : num;
}

/** "4.0 hrs" */
export function formatMinHours(hours: number | string | undefined | null): string {
  if (hours === undefined || hours === null || hours === '') return '4.0 hrs';
  if (typeof hours === 'number') return `${hours.toFixed(1)} hrs`;
  const num = parseFloat(String(hours).replace(/[^0-9.]/g, ''));
  return Number.isNaN(num) ? '4.0 hrs' : `${num.toFixed(1)} hrs`;
}

export function parseMinHours(hours: number | string | undefined | null): number {
  if (typeof hours === 'number') return hours;
  if (!hours) return 4.0;
  const num = parseFloat(String(hours).replace(/[^0-9.]/g, ''));
  return Number.isNaN(num) ? 4.0 : num;
}
