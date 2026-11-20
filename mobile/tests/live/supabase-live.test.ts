/**
 * Live check against a local Supabase. Skipped unless LIVE_SUPABASE=1.
 *   LIVE_SUPABASE=1 LIVE_SUPABASE_URL=http://127.0.0.1:54321 LIVE_SUPABASE_ANON_KEY=... \
 *   LIVE_DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres npx jest -c jest.live.config.js
 * Signs in the seed operator Rob Black (+12075550168, test code 123456) and walks a job through the flow.
 * It changes data in that database (run `supabase db reset` afterwards to get fresh demo jobs).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseApi } from '@/api/supabase-api';

// Node's child_process (no @types/node in this project, so typed by hand)
const { execFileSync } = require('child_process') as {
  execFileSync: (cmd: string, args: string[], opts: { encoding: 'utf8' }) => string;
};

// Node has Blob but no FileReader (the phone has both); the app reads the signature with FileReader.
class NodeFileReader {
  result: string | null = null;
  error: unknown = null;
  onloadend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(blob: Blob): void {
    blob.arrayBuffer().then(
      (buf) => {
        this.result = `data:${blob.type};base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
        this.onloadend?.();
      },
      (e) => {
        this.error = e;
        this.onerror?.();
      }
    );
  }
}
(globalThis as unknown as { FileReader: unknown }).FileReader = NodeFileReader;

const live = process.env.LIVE_SUPABASE === '1';
const url = process.env.LIVE_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const anon = process.env.LIVE_SUPABASE_ANON_KEY ?? '';
const dbUrl = process.env.LIVE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const PHONE = '+12075550168';
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const sql = (query: string): string =>
  execFileSync('psql', [dbUrl, '-At', '-c', query], { encoding: 'utf8' }).trim();

const memory = new Map<string, string>();
const storage = {
  getItem: async (k: string) => memory.get(k) ?? null,
  setItem: async (k: string, v: string) => void memory.set(k, v),
  removeItem: async (k: string) => void memory.delete(k),
};

(live ? describe : describe.skip)('live: operator flow against local Supabase', () => {
  let client: SupabaseClient | null = null;
  const live_api = new SupabaseApi(() => {
    client ??= createClient(url, anon, { auth: { storage, persistSession: true, autoRefreshToken: false } });
    return client;
  });

  it('rejects an unknown phone number', async () => {
    await expect(live_api.sendCode('+12075559999')).rejects.toMatchObject({ code: 'phone_not_found' });
  });

  it('runs the full job flow', async () => {
    // one send only: the server limits how often a code can be sent to the same number
    await live_api.sendCode(PHONE);
    await expect(live_api.verifyCode(PHONE, '000000')).rejects.toMatchObject({ code: 'bad_code' });
    await live_api.verifyCode(PHONE, '123456');

    const me = await live_api.getMe();
    expect(me.firstName).toBe('Rob');
    expect(sql(`select user_id is not null from employees where id = '${me.employeeId}'`)).toBe('t');

    const today = await live_api.listToday();
    expect(today.length).toBeGreaterThan(0);
    const job = today.find((j) => j.acknowledgedAt === null && !j.isCancelled && j.ticketStatus === 'not_started');
    expect(job).toBeDefined();
    const jobId = job!.id;
    const upcoming = await live_api.listUpcoming(14);
    expect(upcoming.every((j) => !today.some((t) => t.id === j.id))).toBe(true);

    await live_api.markSeen(jobId);
    const before = sql(`select count(*) from job_status_history where job_id = '${jobId}'`);

    const t0 = new Date();
    const at = (min: number) => new Date(t0.getTime() + min * 60000).toISOString();
    await live_api.acknowledge(jobId, at(0));
    await live_api.acknowledge(jobId, at(1)); // retry: first tap wins
    expect((await live_api.getJob(jobId)).acknowledgedAt).toBe(at(0));

    await live_api.recordStep(jobId, 'departed_shop', at(2));
    await live_api.recordStep(jobId, 'departed_shop', at(3)); // retry: no duplicate
    expect(sql(`select field_status from jobs where id = '${jobId}'`)).toBe('en_route');
    await live_api.editStepTime(jobId, 'departed_shop', at(4));
    await live_api.recordStep(jobId, 'arrived_site', at(10));
    expect(sql(`select field_status from jobs where id = '${jobId}'`)).toBe('on_site');
    await live_api.undoStep(jobId, 'arrived_site');
    expect(sql(`select field_status from jobs where id = '${jobId}'`)).toBe('en_route');
    await live_api.recordStep(jobId, 'arrived_site', at(11));
    await live_api.recordStep(jobId, 'departed_site', at(30));
    expect(sql(`select field_status from jobs where id = '${jobId}'`)).toBe('returning');
    await expect(live_api.recordStep(jobId, 'arrived_shop', at(-60))).rejects.toMatchObject({
      code: 'step_out_of_order',
    });

    const extras = await live_api.getTicketExtras();
    expect(extras.length).toBeGreaterThan(0);
    expect(await live_api.getTicket(jobId)).toBeNull();
    await live_api.saveTicket({
      jobId, arrivedOnSiteAt: at(11), startedPourAt: at(15), finishedPourAt: at(25), departedSiteAt: at(30),
      yardsPumped: 12.5, hose3inFt: null, hose4inFt: 50, extras: [extras[0].code], comments: 'live check',
      signerName: 'Sam Lee', signaturePng: PNG, signedAt: at(26), updatedAt: '',
    });
    const saved = await live_api.getTicket(jobId);
    expect(saved?.yardsPumped).toBe(12.5);
    expect(saved?.signaturePng).toContain('data:image/png;base64,');
    expect((await live_api.getJob(jobId)).ticketStatus).toBe('draft');

    await live_api.submitTicket(jobId);
    await live_api.submitTicket(jobId); // retry: no-op
    expect(sql(`select field_status from jobs where id = '${jobId}'`)).toBe('done');
    expect(sql(`select status from work_tickets where job_id = '${jobId}'`)).toBe('submitted');
    expect(sql(`select count(*) from job_step_events where job_id = '${jobId}' and undone_at is null`)).toBe('3');
    expect(Number(sql(`select count(*) from job_status_history where job_id = '${jobId}'`))).toBeGreaterThan(
      Number(before)
    );
    await expect(
      live_api.saveTicket({ ...saved!, comments: 'too late', signaturePng: null })
    ).rejects.toMatchObject({ code: 'ticket_locked' });

    await live_api.signOut();
    await expect(live_api.getMe()).rejects.toMatchObject({ code: 'forbidden' });
  });
});
