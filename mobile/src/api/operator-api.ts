import {
  Operator,
  OperatorJob,
  JobStep,
  TicketExtra,
  WorkTicketDraft,
} from './types';

export interface OperatorApi {
  sendCode(phoneE164: string): Promise<void>;
  verifyCode(phoneE164: string, code: string): Promise<void>;
  signOut(): Promise<void>;
  getMe(): Promise<Operator>;

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

  resetDemoData?(): Promise<void>;
}
