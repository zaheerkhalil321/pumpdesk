import { mockApi } from '../src/api/mock-api';

describe('Mock API Service', () => {
  beforeEach(async () => {
    await mockApi.resetDemoData();
  });

  it('rejects unknown phone numbers during sign in', async () => {
    await expect(mockApi.sendCode('+19999999999')).rejects.toThrow(
      "We couldn't find this number"
    );
  });

  it('succeeds sendCode for valid operator phone', async () => {
    await expect(mockApi.sendCode('+12075550168')).resolves.toBeUndefined();
  });

  it('fails verifyCode on 000000', async () => {
    await expect(mockApi.verifyCode('+12075550168', '000000')).rejects.toThrow(
      "That code didn't work"
    );
  });

  it('succeeds verifyCode on valid 6 digits and sets operator session', async () => {
    await mockApi.verifyCode('+12075550168', '123456');
    const me = await mockApi.getMe();
    expect(me.firstName).toBe('Rob');
    expect(me.lastName).toBe('Black');
    expect(me.company.name).toBe('Midcoast Concrete Pumping');
  });

  it('returns today jobs and upcoming jobs properly', async () => {
    const todayJobs = await mockApi.listToday();
    expect(todayJobs.length).toBeGreaterThan(0);

    const upcomingJobs = await mockApi.listUpcoming(14);
    expect(upcomingJobs.length).toBeGreaterThan(0);
  });

  it('supports acknowledging and recording steps', async () => {
    const job = await mockApi.getJob('job-104');
    expect(job.acknowledgedAt).toBeNull();

    const nowIso = new Date().toISOString();
    await mockApi.acknowledge('job-104', nowIso);
    const updated = await mockApi.getJob('job-104');
    expect(updated.acknowledgedAt).toBe(nowIso);

    await mockApi.recordStep('job-104', 'arrived_shop', nowIso);
    const stepUpdated = await mockApi.getJob('job-104');
    expect(stepUpdated.steps.arrived_shop).toBe(nowIso);

    await mockApi.undoStep('job-104', 'arrived_shop');
    const undone = await mockApi.getJob('job-104');
    expect(undone.steps.arrived_shop).toBeNull();
  });

  it('clocks in, is idempotent, then clocks out', async () => {
    const t0 = new Date(Date.now() - 3600_000).toISOString();
    const a = await mockApi.clockIn(t0);
    const b = await mockApi.clockIn(new Date().toISOString());
    expect(b.id).toBe(a.id);
    const out = await mockApi.clockOut(new Date().toISOString());
    expect(out?.clockedOutAt).not.toBeNull();
    const list = await mockApi.listTimeEntries(new Date(Date.now() - 86400_000).toISOString(), new Date(Date.now() + 86400_000).toISOString());
    expect(list).toHaveLength(1);
  });

  it('refuses a clock in from the future and an overlap', async () => {
    await expect(mockApi.clockIn(new Date(Date.now() + 3600_000).toISOString())).rejects.toMatchObject({ code: 'invalid_time' });
    await mockApi.clockIn(new Date(Date.now() - 7200_000).toISOString());
    await mockApi.clockOut(new Date(Date.now() - 3600_000).toISOString());
    await expect(mockApi.clockIn(new Date(Date.now() - 5400_000).toISOString())).rejects.toMatchObject({ code: 'overlaps_previous' });
  });

  it('answers null when clocking out before any shift', async () => {
    expect(await mockApi.clockOut(new Date().toISOString())).toBeNull();
  });

  it('refuses a range over 62 days', async () => {
    await expect(mockApi.listTimeEntries('2026-01-01T00:00:00Z', '2026-06-01T00:00:00Z')).rejects.toMatchObject({ code: 'invalid_range' });
  });
});
