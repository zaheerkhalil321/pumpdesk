import {
  ApiError,
  JobStep,
  ClockEntry,
  Operator,
  OperatorJob,
  Place,
  TicketExtra,
  TicketStatus,
  WorkTicketDraft,
} from './types';

type Json = Record<string, unknown>;

const STEPS: JobStep[] = ['arrived_shop', 'departed_shop', 'arrived_site', 'departed_site'];

function obj(value: unknown, what: string): Json {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Json;
  throw new ApiError('unknown', `Unexpected response for ${what}.`);
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
/** numeric columns may arrive as numbers or as strings */
const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

export function mapPlace(raw: unknown): Place {
  const p = obj(raw ?? {}, 'place');
  return {
    label: str(p.label),
    street: strOrNull(p.street),
    town: strOrNull(p.town),
    lat: numOrNull(p.lat),
    lng: numOrNull(p.lng),
  };
}

export function mapOperator(raw: unknown): Operator {
  const o = obj(raw, 'operator');
  const c = obj(o.company, 'company');
  return {
    employeeId: str(o.employeeId),
    firstName: str(o.firstName),
    lastName: str(o.lastName),
    phone: str(o.phone),
    company: {
      id: str(c.id),
      name: str(c.name),
      town: str(c.town),
      dispatchPhone: str(c.dispatchPhone),
      termsUrl: strOrNull(c.termsUrl),
    },
  };
}

function mapTicketStatus(v: unknown): TicketStatus {
  return v === 'draft' || v === 'submitted' ? v : 'not_started';
}

export function mapJob(raw: unknown): OperatorJob {
  const j = obj(raw, 'job');
  const shop = obj(j.shop ?? {}, 'shop');
  const steps = obj(j.steps ?? {}, 'steps');
  const pump = j.pump ? obj(j.pump, 'pump') : null;
  const contact = j.siteContact ? obj(j.siteContact, 'contact') : null;

  return {
    id: str(j.id),
    jobNumber: str(j.jobNumber),
    jobName: strOrNull(j.jobName),
    customerName: str(j.customerName),
    site: mapPlace(j.site),
    shop: { ...mapPlace(shop), name: str(shop.name) },
    timezone: str(j.timezone) || 'America/New_York',
    arriveShopBy: strOrNull(j.arriveShopBy),
    pourStartsAt: str(j.pourStartsAt),
    pump: pump ? { unit: str(pump.unit), label: str(pump.label) } : null,
    estimatedYards: numOrNull(j.estimatedYards) ?? 0,
    notesForOperator: strOrNull(j.notesForOperator),
    siteContact: contact
      ? { name: str(contact.name), role: strOrNull(contact.role), phone: strOrNull(contact.phone) }
      : null,
    isCancelled: j.isCancelled === true,
    changedSinceSeen: j.changedSinceSeen === true,
    acknowledgedAt: strOrNull(j.acknowledgedAt),
    steps: Object.fromEntries(STEPS.map((s) => [s, strOrNull(steps[s])])) as Record<
      JobStep,
      string | null
    >,
    ticketStatus: mapTicketStatus(j.ticketStatus),
  };
}

export function mapJobs(raw: unknown): OperatorJob[] {
  if (raw === null || raw === undefined) return [];
  if (!Array.isArray(raw)) throw new ApiError('unknown', 'Unexpected response for jobs.');
  return raw.map(mapJob);
}

export function mapExtras(raw: unknown): TicketExtra[] {
  if (raw === null || raw === undefined) return [];
  if (!Array.isArray(raw)) throw new ApiError('unknown', 'Unexpected response for extras.');
  return raw.map((x) => {
    const e = obj(x, 'extra');
    return { code: str(e.code), label: str(e.label) };
  });
}

/** Returns the ticket plus the storage path of its signature (the image is downloaded separately). */
export function mapTicket(raw: unknown): { draft: WorkTicketDraft; signaturePath: string | null } | null {
  if (raw === null || raw === undefined) return null;
  const t = obj(raw, 'ticket');
  return {
    signaturePath: strOrNull(t.signaturePath),
    draft: {
      jobId: str(t.jobId),
      arrivedOnSiteAt: strOrNull(t.arrivedOnSiteAt),
      startedPourAt: strOrNull(t.startedPourAt),
      finishedPourAt: strOrNull(t.finishedPourAt),
      departedSiteAt: strOrNull(t.departedSiteAt),
      yardsPumped: numOrNull(t.yardsPumped),
      hose3inFt: numOrNull(t.hose3inFt),
      hose4inFt: numOrNull(t.hose4inFt),
      extras: Array.isArray(t.extras) ? t.extras.filter((x): x is string => typeof x === 'string') : [],
      comments: str(t.comments),
      signerName: strOrNull(t.signerName),
      signaturePng: null,
      signedAt: strOrNull(t.signedAt),
      updatedAt: str(t.updatedAt),
    },
  };
}

/** The JSON the save_work_ticket function expects. The image itself is uploaded separately. */
export function ticketToPayload(draft: WorkTicketDraft, signaturePath: string | null): Json {
  return {
    jobId: draft.jobId,
    arrivedOnSiteAt: draft.arrivedOnSiteAt,
    startedPourAt: draft.startedPourAt,
    finishedPourAt: draft.finishedPourAt,
    departedSiteAt: draft.departedSiteAt,
    yardsPumped: draft.yardsPumped,
    hose3inFt: draft.hose3inFt,
    hose4inFt: draft.hose4inFt,
    extras: draft.extras,
    comments: draft.comments,
    signerName: draft.signerName,
    signaturePath,
    signedAt: draft.signedAt,
  };
}

const DATA_URL_PREFIX = /^data:image\/png;base64,/;

/** "data:image/png;base64,AAAA" (or bare base64) to bytes. */
export function pngDataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.replace(DATA_URL_PREFIX, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const signaturePathFor = (companyId: string, jobId: string): string =>
  `${companyId}/${jobId}.png`;

/** One time-clock entry from clock_in / clock_out / operator_time_entries. */
/** Postgres sends "...+00:00"; the app writes "...Z". Same format both ways, so taps can be matched. */
function isoOrNull(value: unknown): string | null {
  const s = strOrNull(value);
  if (!s) return null;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? s : new Date(ms).toISOString();
}

export function mapClockEntry(raw: unknown): ClockEntry {
  const e = obj(raw, 'time entry');
  const clockedInAt = isoOrNull(e.clock_in);
  if (!clockedInAt) throw new ApiError('unknown', 'Unexpected response for time entry.');
  return {
    id: str(e.id),
    clockedInAt,
    clockedOutAt: isoOrNull(e.clock_out),
    breakMinutes: numOrNull(e.break_minutes) ?? 0,
    jobId: strOrNull(e.job_id),
  };
}

/** clock_out answers null when the operator has never clocked in. */
export function mapClockEntryOrNull(raw: unknown): ClockEntry | null {
  return raw === null || raw === undefined ? null : mapClockEntry(raw);
}

export function mapClockEntries(raw: unknown): ClockEntry[] {
  if (raw === null || raw === undefined) return [];
  if (!Array.isArray(raw)) throw new ApiError('unknown', 'Unexpected response for time entries.');
  return raw.map(mapClockEntry);
}
