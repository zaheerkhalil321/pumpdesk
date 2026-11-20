import {
  Operator,
  OperatorJob,
  JobStep,
  TicketExtra,
  WorkTicketDraft,
  ClockEntry,
} from './types';

export interface OperatorApi {
  sendCode(phoneE164: string): Promise<void>;
  verifyCode(phoneE164: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  getMe(): Promise<Operator>;
  /** Called when the login ends on its own (refresh token expired or revoked). Returns an unsubscribe. */
  onSignedOut(listener: () => void): () => void;

  listToday(): Promise<OperatorJob[]>;
  listUpcoming(days: number): Promise<OperatorJob[]>;
  getJob(jobId: string): Promise<OperatorJob>;
  markSeen(jobId: string): Promise<void>;

  acknowledge(jobId: string, at: string): Promise<void>;
  recordStep(jobId: string, step: JobStep, at: string): Promise<void>;
  undoStep(jobId: string, step: JobStep): Promise<void>;
  editStepTime(jobId: string, step: JobStep, at: string): Promise<void>;

  getTicketExtras(): Promise<TicketExtra[]>;
  getTicket(jobId: string): Promise<WorkTicketDraft | null>;
  saveTicket(draft: WorkTicketDraft): Promise<void>;
  submitTicket(jobId: string): Promise<void>;

  /** The operator's shifts that overlap [from, to), oldest first. */
  listTimeEntries(from: string, to: string): Promise<ClockEntry[]>;
  /** Idempotent: when a shift is already open, that shift comes back. */
  clockIn(at: string): Promise<ClockEntry>;
  /** Closes the open shift. With none open, returns the latest closed shift, or null. */
  clockOut(at: string): Promise<ClockEntry | null>;

  resetDemoData?(): Promise<void>;
}
