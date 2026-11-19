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
});
