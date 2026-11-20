import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { OperatorApi } from './operator-api';
import { todayWindow, upcomingWindow } from './day-window';
import { mapSupabaseError } from './supabase-errors';
import {
  mapClockEntries,
  mapClockEntry,
  mapClockEntryOrNull,
  mapExtras,
  mapJob,
  mapJobs,
  mapOperator,
  mapTicket,
  pngDataUrlToBytes,
  signaturePathFor,
  ticketToPayload,
} from './supabase-mapping';
import {
  ApiError,
  ClockEntry,
  JobStep,
  Operator,
  OperatorJob,
  TicketExtra,
  WorkTicketDraft,
} from './types';

const SIGNATURE_BUCKET = 'signatures';

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export class SupabaseApi implements OperatorApi {
  // The client is created on first use so mock mode never needs the env values.
  constructor(private readonly clientFactory: () => SupabaseClient = getSupabase) {}

  private get db(): SupabaseClient {
    return this.clientFactory();
  }

  /** Calls an RPC and returns its JSON, or throws an ApiError. */
  private async rpc(fn: string, args?: Record<string, unknown>): Promise<unknown> {
    const { data, error } = await this.db.rpc(fn, args);
    if (error) throw mapSupabaseError(error);
    return data;
  }

  async sendCode(phoneE164: string): Promise<void> {
    const { error } = await this.db.auth.signInWithOtp({ phone: phoneE164 });
    if (error) throw mapSupabaseError(error);
  }

  async verifyCode(phoneE164: string, code: string): Promise<void> {
    const { error } = await this.db.auth.verifyOtp({ phone: phoneE164, token: code, type: 'sms' });
    if (error) throw mapSupabaseError(error);
    try {
      await this.rpc('link_operator_login');
    } catch (e) {
      // A login that is not an operator must not stay signed in.
      await this.db.auth.signOut().catch(() => undefined);
      throw e;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.db.auth.signOut();
    if (error) throw mapSupabaseError(error);
  }

  async getMe(): Promise<Operator> {
    const { data, error } = await this.db.auth.getSession();
    // No signal while the saved login is being refreshed: "offline", not "signed out".
    if (error) throw mapSupabaseError(error);
    if (!data.session) throw new ApiError('forbidden', 'Not signed in.');
    return mapOperator(await this.rpc('operator_me'));
  }

  onSignedOut(listener: () => void): () => void {
    const { data } = this.db.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') listener();
    });
    return () => data.subscription.unsubscribe();
  }

  async listToday(): Promise<OperatorJob[]> {
    const w = todayWindow();
    return mapJobs(await this.rpc('operator_jobs', { p_from: w.from, p_to: w.to }));
  }

  async listUpcoming(days: number): Promise<OperatorJob[]> {
    const w = upcomingWindow(days);
    return mapJobs(await this.rpc('operator_jobs', { p_from: w.from, p_to: w.to }));
  }

  async getJob(jobId: string): Promise<OperatorJob> {
    return mapJob(await this.rpc('operator_job', { p_job_id: jobId }));
  }

  async markSeen(jobId: string): Promise<void> {
    await this.rpc('mark_job_seen', { p_job_id: jobId });
  }

  async acknowledge(jobId: string, at: string): Promise<void> {
    await this.rpc('acknowledge_assignment', { p_job_id: jobId, p_at: at });
  }

  async recordStep(jobId: string, step: JobStep, at: string): Promise<void> {
    await this.rpc('record_job_step', { p_job_id: jobId, p_step: step, p_at: at });
  }

  async undoStep(jobId: string, step: JobStep): Promise<void> {
    await this.rpc('undo_job_step', { p_job_id: jobId, p_step: step });
  }

  async editStepTime(jobId: string, step: JobStep, at: string): Promise<void> {
    await this.rpc('edit_job_step_time', { p_job_id: jobId, p_step: step, p_at: at });
  }

  async listTimeEntries(from: string, to: string): Promise<ClockEntry[]> {
    return mapClockEntries(await this.rpc('operator_time_entries', { p_from: from, p_to: to }));
  }

  async clockIn(at: string): Promise<ClockEntry> {
    return mapClockEntry(await this.rpc('clock_in', { p_at: at }));
  }

  async clockOut(at: string): Promise<ClockEntry | null> {
    return mapClockEntryOrNull(await this.rpc('clock_out', { p_at: at }));
  }

  async getTicketExtras(): Promise<TicketExtra[]> {
    return mapExtras(await this.rpc('ticket_extras'));
  }

  async getTicket(jobId: string): Promise<WorkTicketDraft | null> {
    const ticket = mapTicket(await this.rpc('get_work_ticket', { p_job_id: jobId }));
    if (!ticket) return null;
    if (ticket.signaturePath) {
      const { data, error } = await this.db.storage.from(SIGNATURE_BUCKET).download(ticket.signaturePath);
      if (!error && data) ticket.draft.signaturePng = await blobToDataUrl(data);
    }
    return ticket.draft;
  }

  async saveTicket(draft: WorkTicketDraft): Promise<void> {
    let signaturePath: string | null = null;
    if (draft.signaturePng) {
      const operator = await this.getMe();
      signaturePath = signaturePathFor(operator.company.id, draft.jobId);
      const { error } = await this.db.storage
        .from(SIGNATURE_BUCKET)
        .upload(signaturePath, pngDataUrlToBytes(draft.signaturePng), {
          contentType: 'image/png',
          upsert: true,
        });
      if (error) throw mapSupabaseError(error);
    }
    await this.rpc('save_work_ticket', { p_draft: ticketToPayload(draft, signaturePath) });
  }

  async submitTicket(jobId: string): Promise<void> {
    await this.rpc('submit_work_ticket', { p_job_id: jobId });
  }
}

export const supabaseApi = new SupabaseApi();
