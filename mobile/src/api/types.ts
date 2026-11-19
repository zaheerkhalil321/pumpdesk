export type JobStep = 'arrived_shop' | 'departed_shop' | 'arrived_site' | 'departed_site';

export type TicketStatus = 'not_started' | 'draft' | 'submitted';

export interface Operator {
  employeeId: string;
  firstName: string;
  lastName: string;
  phone: string; // E.164, "+12075550168"
  company: {
    id: string;
    name: string; // "Midcoast Concrete Pumping"
    town: string; // "Warren, Maine"
    dispatchPhone: string; // E.164
    termsUrl: string | null;
  };
}

export interface Place {
  label: string; // "24 Oak Hill Road, Litchfield, ME"
  street: string | null; // "24 Oak Hill Road"
  town: string | null; // "Litchfield"
  lat: number | null;
  lng: number | null;
}

export interface OperatorJob {
  id: string;
  jobNumber: string; // "ORD-1525"
  jobName: string | null; // "Oak Hill Foundation"
  customerName: string; // "Accurate Concrete"
  site: Place;
  shop: Place & { name: string }; // the operator's home yard
  timezone: string; // IANA, e.g. "America/New_York". Show every time in this zone.
  arriveShopBy: string | null; // ISO instant
  pourStartsAt: string; // ISO instant
  pump: { unit: string; label: string } | null; // { unit: "02", label: "28m boom" }
  estimatedYards: number;
  notesForOperator: string | null; // dispatch notes shown to the operator
  siteContact: { name: string; role: string | null; phone: string | null } | null;
  isCancelled: boolean;
  changedSinceSeen: boolean; // dispatch changed time or address since the operator last opened it
  acknowledgedAt: string | null;
  steps: Record<JobStep, string | null>; // ISO instant per step, null = not done
  ticketStatus: TicketStatus;
}

export interface TicketExtra {
  code: string; // "offsite_washout"
  label: string; // "Off-site washout"
}

export interface WorkTicketDraft {
  jobId: string;
  arrivedOnSiteAt: string | null;
  startedPourAt: string | null;
  finishedPourAt: string | null;
  departedSiteAt: string | null;
  yardsPumped: number | null;
  hose3inFt: number | null;
  hose4inFt: number | null;
  extras: string[]; // TicketExtra codes
  comments: string;
  signerName: string | null;
  signaturePng: string | null; // base64 PNG
  signedAt: string | null;
  updatedAt: string;
}

export type ApiErrorCode =
  | 'not_found'
  | 'phone_not_found'
  | 'bad_code'
  | 'rate_limited'
  | 'offline'
  | 'forbidden'
  | 'conflict'
  | 'unknown';

export class ApiError extends Error {
  code: ApiErrorCode;
  constructor(code: ApiErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}
