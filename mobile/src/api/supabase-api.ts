import { OperatorApi } from './operator-api';
import {
  Operator,
  OperatorJob,
  JobStep,
  TicketExtra,
  WorkTicketDraft,
  ApiError,
} from './types';

export class SupabaseApi implements OperatorApi {
  private notReady(): never {
    throw new ApiError('unknown', 'Supabase API is not configured yet. Set EXPO_PUBLIC_API_MODE=mock.');
  }

  sendCode(_phoneE164: string): Promise<void> {
    this.notReady();
  }
  verifyCode(_phoneE164: string, _code: string): Promise<void> {
    this.notReady();
  }
  signOut(): Promise<void> {
    this.notReady();
  }
  getMe(): Promise<Operator> {
    this.notReady();
  }
  listToday(): Promise<OperatorJob[]> {
    this.notReady();
  }
  listUpcoming(_days: number): Promise<OperatorJob[]> {
    this.notReady();
  }
  getJob(_jobId: string): Promise<OperatorJob> {
    this.notReady();
  }
  markSeen(_jobId: string): Promise<void> {
    this.notReady();
  }
  acknowledge(_jobId: string, _at: string): Promise<void> {
    this.notReady();
  }
  recordStep(_jobId: string, _step: JobStep, _at: string): Promise<void> {
    this.notReady();
  }
  undoStep(_jobId: string, _step: JobStep): Promise<void> {
    this.notReady();
  }
  editStepTime(_jobId: string, _step: JobStep, _at: string): Promise<void> {
    this.notReady();
  }
  getTicketExtras(): Promise<TicketExtra[]> {
    this.notReady();
  }
  getTicket(_jobId: string): Promise<WorkTicketDraft | null> {
    this.notReady();
  }
  saveTicket(_draft: WorkTicketDraft): Promise<void> {
    this.notReady();
  }
  submitTicket(_jobId: string): Promise<void> {
    this.notReady();
  }
}

export const supabaseApi = new SupabaseApi();
