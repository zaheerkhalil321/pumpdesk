/**
 * Where a work ticket stands for the office:
 * the operator is still filling it in, it is turned in and waits for review, or the office reviewed it.
 */
export type TicketState = 'in_progress' | 'needs_review' | 'reviewed';

/** One work ticket with what the office needs to check it. Times are ISO strings (UTC). */
export interface TicketItem {
  id: string;
  jobId: string;
  /** The order it belongs to, e.g. "ORD-1524". */
  orderNumber: string;
  /** The order's version, needed to mark it reviewed. */
  jobVersion: number;
  /** yyyy-MM-dd */
  serviceDate: string;
  /** The order's timezone, so times read as they were on site. */
  timezone: string;
  customerId: string;
  customerName: string;
  siteAddress: string;
  pourType: string;
  operatorId: string;
  operatorName: string;
  operatorPhone: string;
  pumpId: string | null;
  pumpCode: string;
  state: TicketState;
  arrivedAt: string | null;
  startedPourAt: string | null;
  finishedPourAt: string | null;
  departedAt: string | null;
  /** Start to end of the pour, in hours; null until both are set. */
  pumpHours: number | null;
  /** Arrived to departed, in hours; null until both are set. */
  onSiteHours: number | null;
  estimatedYards: number;
  yardsPumped: number | null;
  hose3inFt: number | null;
  hose4inFt: number | null;
  /** Labels of the extras ticked, e.g. "Primer bag". */
  extras: string[];
  comments: string;
  signerName: string | null;
  hasSignature: boolean;
  signedAt: string | null;
  submittedAt: string | null;
  updatedAt: string;
}

export type TicketDatePreset = 'all' | 'this_week' | 'this_month' | 'last_month' | 'custom';

export interface TicketFilters {
  search: string;
  state: TicketState | 'all';
  datePreset: TicketDatePreset;
  /** yyyy-MM-dd, used with the custom preset. */
  from: string;
  to: string;
  customerId: string;
  operatorId: string;
  pumpId: string;
}

export interface TicketTotals {
  count: number;
  needsReview: number;
  yardsPumped: number;
  pumpHours: number;
}
