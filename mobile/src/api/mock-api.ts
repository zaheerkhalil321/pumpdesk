import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatInTimeZone } from 'date-fns-tz';
import {
  Operator,
  OperatorJob,
  JobStep,
  TicketExtra,
  WorkTicketDraft,
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
const SEED_ZONE = 'America/New_York';

// The seed is built around "today", so saved demo data goes stale the next day.
const todayKey = () => formatInTimeZone(new Date(), SEED_ZONE, 'yyyy-MM-dd');

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms));

class MockApi implements OperatorApi {
  private jobs: OperatorJob[] = [];
  private tickets: Record<string, WorkTicketDraft> = {};
  private session: Operator | null = null;
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      const [savedJobs, savedTickets, savedSession, savedSeedDay] = await Promise.all([
        AsyncStorage.getItem(JOBS_STORAGE_KEY),
        AsyncStorage.getItem(TICKETS_STORAGE_KEY),
        AsyncStorage.getItem(SESSION_STORAGE_KEY),
        AsyncStorage.getItem(SEED_DAY_STORAGE_KEY),
      ]);

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
    await AsyncStorage.setItem(SEED_DAY_STORAGE_KEY, todayKey());
    await this.persist();
    // Drop any waiting changes too, so they cannot be applied on top of the fresh data.
    await outbox.clear();
  }
}

export const mockApi = new MockApi();
