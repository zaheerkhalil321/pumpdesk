import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatInTimeZone } from 'date-fns-tz';
import {
  Operator,
  OperatorJob,
  JobStep,
  TicketExtra,
  WorkTicketDraft,
  ClockEntry,
  ApiError,
} from './types';
import { OperatorApi } from './operator-api';
import { outbox } from './outbox';
import {
  SEED_OPERATOR,
  SEED_EXTRAS,
  createInitialSeedJobs,
} from './mock-seed';
import { isSameDayInZone } from '@/lib/dates';
import { extractDigits } from '@/lib/phone';

const JOBS_STORAGE_KEY = '@pumpdesk/mock_jobs';
const TICKETS_STORAGE_KEY = '@pumpdesk/mock_tickets';
const SESSION_STORAGE_KEY = '@pumpdesk/mock_session';
const SEED_DAY_STORAGE_KEY = '@pumpdesk/mock_seed_day';
const TIME_STORAGE_KEY = '@pumpdesk/mock_time_entries';
const SEED_ZONE = 'America/New_York';

// The seed is built around "today", so saved demo data goes stale the next day.
const todayKey = () => formatInTimeZone(new Date(), SEED_ZONE, 'yyyy-MM-dd');

const DAY_MS = 24 * 60 * 60 * 1000;
const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

class MockApi implements OperatorApi {
  private jobs: OperatorJob[] = [];
  private tickets: Record<string, WorkTicketDraft> = {};
  private session: Operator | null = null;
  private timeEntries: ClockEntry[] = [];
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const [savedJobs, savedTickets, savedSession, savedSeedDay, savedTime] = await Promise.all([
        AsyncStorage.getItem(JOBS_STORAGE_KEY),
        AsyncStorage.getItem(TICKETS_STORAGE_KEY),
        AsyncStorage.getItem(SESSION_STORAGE_KEY),
        AsyncStorage.getItem(SEED_DAY_STORAGE_KEY),
        AsyncStorage.getItem(TIME_STORAGE_KEY),
      ]);
      if (savedTime) this.timeEntries = JSON.parse(savedTime);

      if (savedJobs && savedTickets && savedSeedDay === todayKey()) {
        this.jobs = JSON.parse(savedJobs);
        this.tickets = JSON.parse(savedTickets);
      } else {
        const seed = createInitialSeedJobs();
        this.jobs = seed.jobs;
        this.tickets = seed.tickets;
        await AsyncStorage.setItem(SEED_DAY_STORAGE_KEY, todayKey());
        await this.persist();
      }

      if (savedSession) {
        this.session = JSON.parse(savedSession);
      }
    } catch {
      const seed = createInitialSeedJobs();
      this.jobs = seed.jobs;
      this.tickets = seed.tickets;
    }

    this.initialized = true;
  }

  private async persist(): Promise<void> {
    await Promise.all([
      AsyncStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(this.jobs)),
      AsyncStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(this.tickets)),
      AsyncStorage.setItem(TIME_STORAGE_KEY, JSON.stringify(this.timeEntries)),
      this.session
        ? AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.session))
        : AsyncStorage.removeItem(SESSION_STORAGE_KEY),
    ]);
  }

  async sendCode(phoneE164: string): Promise<void> {
    await delay();
    const cleanInput = extractDigits(phoneE164);
    const operatorDigits = extractDigits(SEED_OPERATOR.phone);

    // Accept operator phone or last 10 digits
    if (
      cleanInput !== operatorDigits &&
      !cleanInput.endsWith(operatorDigits.slice(-10)) &&
      cleanInput !== '2075550168'
    ) {
      throw new ApiError(
        'phone_not_found',
        "We couldn't find this number. Ask dispatch to add it."
      );
    }
  }

  async verifyCode(_phoneE164: string, code: string): Promise<void> {
    await delay();
    if (code === '000000' || code.length !== 6) {
      throw new ApiError('bad_code', "That code didn't work. Try again.");
    }
    this.session = SEED_OPERATOR;
    await this.persist();
  }

  async signOut(): Promise<void> {
    await delay(150);
    this.session = null;
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }

  async getMe(): Promise<Operator> {
    await this.ensureInitialized();
    if (!this.session) {
      throw new ApiError('forbidden', 'Not signed in');
    }
    return this.session;
  }

  onSignedOut(): () => void {
    // The demo login never expires on its own.
    return () => undefined;
  }

  async listToday(): Promise<OperatorJob[]> {
    await delay();
    await this.ensureInitialized();
    const today = new Date();
    return this.jobs.filter((j) => isSameDayInZone(j.pourStartsAt, today, j.timezone));
  }

  async listUpcoming(_days: number): Promise<OperatorJob[]> {
    await delay();
    await this.ensureInitialized();
    const today = new Date();
    return this.jobs.filter((j) => !isSameDayInZone(j.pourStartsAt, today, j.timezone));
  }

  async getJob(jobId: string): Promise<OperatorJob> {
    await delay(150);
    await this.ensureInitialized();
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) {
      throw new ApiError('not_found', 'Job not found');
    }
    return { ...job };
  }

  async markSeen(jobId: string): Promise<void> {
    await this.ensureInitialized();
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.changedSinceSeen = false;
      await this.persist();
    }
  }

  async acknowledge(jobId: string, at: string): Promise<void> {
    await delay(200);
    await this.ensureInitialized();
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) throw new ApiError('not_found', 'Job not found');
    job.acknowledgedAt = at;
    await this.persist();
  }

  async recordStep(jobId: string, step: JobStep, at: string): Promise<void> {
    await delay(200);
    await this.ensureInitialized();
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) throw new ApiError('not_found', 'Job not found');
    job.steps[step] = at;
    await this.persist();
  }

  async undoStep(jobId: string, step: JobStep): Promise<void> {
    await delay(150);
    await this.ensureInitialized();
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) throw new ApiError('not_found', 'Job not found');
    job.steps[step] = null;
    await this.persist();
  }

  async editStepTime(jobId: string, step: JobStep, at: string): Promise<void> {
    await delay(200);
    await this.ensureInitialized();
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) throw new ApiError('not_found', 'Job not found');
    job.steps[step] = at;
    await this.persist();
  }

  async listTimeEntries(from: string, to: string): Promise<ClockEntry[]> {
    await delay(150);
    await this.ensureInitialized();
    const lo = new Date(from).getTime();
    const hi = new Date(to).getTime();
    if (!(hi > lo) || hi - lo > 62 * DAY_MS) throw new ApiError('invalid_range', 'That date range is too long.');
    return this.timeEntries
      .filter(
        (e) =>
          new Date(e.clockedInAt).getTime() < hi &&
          (e.clockedOutAt ? new Date(e.clockedOutAt).getTime() : Infinity) > lo
      )
      .sort((a, b) => a.clockedInAt.localeCompare(b.clockedInAt))
      .map((e) => ({ ...e }));
  }

  async clockIn(at: string): Promise<ClockEntry> {
    await delay(200);
    await this.ensureInitialized();
    const t = new Date(at).getTime();
    if (Number.isNaN(t) || t > Date.now() + 5 * 60 * 1000) {
      throw new ApiError('invalid_time', 'That time is not valid.');
    }
    const open = this.timeEntries.find((e) => !e.clockedOutAt);
    if (open) return { ...open };
    const last = this.timeEntries.reduce<number>(
      (max, e) => Math.max(max, e.clockedOutAt ? new Date(e.clockedOutAt).getTime() : 0),
      0
    );
    if (t < last) throw new ApiError('overlaps_previous', 'That time overlaps your last shift.');
    const entry: ClockEntry = {
      id: `mock-time-${t}`,
      clockedInAt: new Date(t).toISOString(),
      clockedOutAt: null,
      breakMinutes: 0,
      jobId: null,
    };
    this.timeEntries.push(entry);
    await this.persist();
    return { ...entry };
  }

  async clockOut(at: string): Promise<ClockEntry | null> {
    await delay(200);
    await this.ensureInitialized();
    const t = new Date(at).getTime();
    if (Number.isNaN(t) || t > Date.now() + 5 * 60 * 1000) {
      throw new ApiError('invalid_time', 'That time is not valid.');
    }
    const open = this.timeEntries.find((e) => !e.clockedOutAt);
    if (open) {
      if (t < new Date(open.clockedInAt).getTime()) throw new ApiError('invalid_time', 'That time is not valid.');
      open.clockedOutAt = new Date(t).toISOString();
      await this.persist();
      return { ...open };
    }
    const latest = [...this.timeEntries].sort((a, b) => b.clockedInAt.localeCompare(a.clockedInAt))[0];
    return latest ? { ...latest } : null;
  }

  async getTicketExtras(): Promise<TicketExtra[]> {
    return [...SEED_EXTRAS];
  }

  async getTicket(jobId: string): Promise<WorkTicketDraft | null> {
    await delay(150);
    await this.ensureInitialized();
    return this.tickets[jobId] || null;
  }

  async saveTicket(draft: WorkTicketDraft): Promise<void> {
    await delay(200);
    await this.ensureInitialized();
    this.tickets[draft.jobId] = { ...draft, updatedAt: new Date().toISOString() };
    const job = this.jobs.find((j) => j.id === draft.jobId);
    if (job && job.ticketStatus === 'not_started') {
      job.ticketStatus = 'draft';
    }
    await this.persist();
  }

  async submitTicket(jobId: string): Promise<void> {
    await delay(300);
    await this.ensureInitialized();
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) throw new ApiError('not_found', 'Job not found');
    job.ticketStatus = 'submitted';
    if (this.tickets[jobId]) {
      this.tickets[jobId].updatedAt = new Date().toISOString();
    }
    await this.persist();
  }

  async resetDemoData(): Promise<void> {
    const seed = createInitialSeedJobs();
    this.jobs = seed.jobs;
    this.tickets = seed.tickets;
    this.session = SEED_OPERATOR;
    this.timeEntries = [];
    await AsyncStorage.setItem(SEED_DAY_STORAGE_KEY, todayKey());
    await this.persist();
    // Drop any waiting changes too, so they cannot be applied on top of the fresh data.
    await outbox.clear();
  }
}

export const mockApi = new MockApi();
