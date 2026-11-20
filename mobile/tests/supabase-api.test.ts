import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseApi } from '@/api/supabase-api';
import { ApiError } from '@/api/types';

const OPERATOR = {
  employeeId: 'e1', firstName: 'Rob', lastName: 'Black', phone: '+12075550168',
  company: { id: 'c1', name: 'Midcoast', town: 'Warren, ME', dispatchPhone: '', termsUrl: null },
};

function makeClient(overrides: Record<string, unknown> = {}) {
  const rpc = jest.fn().mockResolvedValue({ data: null, error: null });
  const upload = jest.fn().mockResolvedValue({ error: null });
  const client = {
    rpc,
    auth: {
      signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 't' } } }),
    },
    storage: { from: jest.fn().mockReturnValue({ upload, download: jest.fn() }) },
    ...overrides,
  };
  return { api: new SupabaseApi(() => client as unknown as SupabaseClient), client, rpc, upload };
}

describe('SupabaseApi', () => {
  it('sends the code with the phone number', async () => {
    const { api, client } = makeClient();
    await api.sendCode('+12075550168');
    expect(client.auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+12075550168' });
  });

  it('maps a rejected phone to phone_not_found', async () => {
    const { api, client } = makeClient();
    client.auth.signInWithOtp.mockResolvedValue({ error: { message: 'Hook requested 403: phone_not_found', status: 403 } });
    await expect(api.sendCode('+12075550999')).rejects.toMatchObject({ code: 'phone_not_found' });
  });

  it('verifies the code then links the operator', async () => {
    const { api, client, rpc } = makeClient();
    await api.verifyCode('+12075550168', '123456');
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({ phone: '+12075550168', token: '123456', type: 'sms' });
    expect(rpc).toHaveBeenCalledWith('link_operator_login', undefined);
  });

  it('signs out again when linking fails', async () => {
    const { api, client, rpc } = makeClient();
    rpc.mockResolvedValue({ data: null, error: { message: 'phone_not_found', code: 'P0001' } });
    await expect(api.verifyCode('+12075550999', '123456')).rejects.toMatchObject({ code: 'phone_not_found' });
    expect(client.auth.signOut).toHaveBeenCalled();
  });

  it('maps a wrong code to bad_code', async () => {
    const { api, client } = makeClient();
    client.auth.verifyOtp.mockResolvedValue({ error: { message: 'Token has expired or is invalid', status: 403 } });
    await expect(api.verifyCode('+12075550168', '000000')).rejects.toMatchObject({ code: 'bad_code' });
  });

  it('getMe fails fast when there is no session', async () => {
    const { api, client, rpc } = makeClient();
    client.auth.getSession.mockResolvedValue({ data: { session: null } });
    await expect(api.getMe()).rejects.toBeInstanceOf(ApiError);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('calls the step functions with the right arguments', async () => {
    const { api, rpc } = makeClient();
    await api.acknowledge('j1', '2026-11-19T12:00:00.000Z');
    await api.recordStep('j1', 'departed_shop', '2026-11-19T12:05:00.000Z');
    await api.undoStep('j1', 'departed_shop');
    await api.editStepTime('j1', 'departed_shop', '2026-11-19T12:06:00.000Z');
    await api.markSeen('j1');
    await api.submitTicket('j1');
    expect(rpc.mock.calls).toEqual([
      ['acknowledge_assignment', { p_job_id: 'j1', p_at: '2026-11-19T12:00:00.000Z' }],
      ['record_job_step', { p_job_id: 'j1', p_step: 'departed_shop', p_at: '2026-11-19T12:05:00.000Z' }],
      ['undo_job_step', { p_job_id: 'j1', p_step: 'departed_shop' }],
      ['edit_job_step_time', { p_job_id: 'j1', p_step: 'departed_shop', p_at: '2026-11-19T12:06:00.000Z' }],
      ['mark_job_seen', { p_job_id: 'j1' }],
      ['submit_work_ticket', { p_job_id: 'j1' }],
    ]);
  });

  it('maps a backend step error', async () => {
    const { api, rpc } = makeClient();
    rpc.mockResolvedValue({ data: null, error: { message: 'step_out_of_order', code: 'P0001' } });
    await expect(api.recordStep('j1', 'arrived_site', 'x')).rejects.toMatchObject({ code: 'step_out_of_order' });
  });

  it('lists today with a one-day window', async () => {
    const { api, rpc } = makeClient();
    rpc.mockResolvedValue({ data: [], error: null });
    expect(await api.listToday()).toEqual([]);
    const args = rpc.mock.calls[0][1];
    expect(rpc.mock.calls[0][0]).toBe('operator_jobs');
    expect(new Date(args.p_to).getTime() - new Date(args.p_from).getTime()).toBeGreaterThanOrEqual(23 * 3600 * 1000);
  });

  it('uploads the signature to <company>/<job>.png, then saves the path', async () => {
    const { api, rpc, upload } = makeClient();
    rpc.mockImplementation(async (fn: string) =>
      fn === 'operator_me' ? { data: OPERATOR, error: null } : { data: {}, error: null }
    );
    await api.saveTicket({
      jobId: 'j1', arrivedOnSiteAt: null, startedPourAt: null, finishedPourAt: null, departedSiteAt: null,
      yardsPumped: 5, hose3inFt: null, hose4inFt: null, extras: [], comments: '', signerName: 'Sam',
      signaturePng: 'data:image/png;base64,AQID', signedAt: '2026-11-19T17:00:00.000Z', updatedAt: '',
    });
    expect(upload).toHaveBeenCalledWith('c1/j1.png', expect.any(Uint8Array), { contentType: 'image/png', upsert: true });
    const save = rpc.mock.calls.find((c) => c[0] === 'save_work_ticket');
    expect(save?.[1].p_draft.signaturePath).toBe('c1/j1.png');
  });

  it('saves without upload when there is no signature', async () => {
    const { api, rpc, upload } = makeClient();
    await api.saveTicket({
      jobId: 'j1', arrivedOnSiteAt: null, startedPourAt: null, finishedPourAt: null, departedSiteAt: null,
      yardsPumped: null, hose3inFt: null, hose4inFt: null, extras: [], comments: '', signerName: null,
      signaturePng: null, signedAt: null, updatedAt: '',
    });
    expect(upload).not.toHaveBeenCalled();
    expect(rpc.mock.calls[0][1].p_draft.signaturePath).toBeNull();
  });

  it('lists time entries for a range', async () => {
    const { api, rpc } = makeClient();
    rpc.mockResolvedValue({
      data: [{ id: 't1', clock_in: '2026-11-17T11:00:00Z', clock_out: null, break_minutes: 0, job_id: null }],
      error: null,
    });
    const list = await api.listTimeEntries('2026-11-16T05:00:00Z', '2026-11-23T05:00:00Z');
    expect(rpc).toHaveBeenCalledWith('operator_time_entries', { p_from: '2026-11-16T05:00:00Z', p_to: '2026-11-23T05:00:00Z' });
    expect(list[0].clockedOutAt).toBeNull();
  });

  it('clocks in and out with the tap time', async () => {
    const { api, rpc } = makeClient();
    rpc.mockResolvedValue({ data: { id: 't1', clock_in: '2026-11-17T11:00:00Z', clock_out: null, break_minutes: 0, job_id: null }, error: null });
    expect((await api.clockIn('2026-11-17T11:00:00Z')).id).toBe('t1');
    expect(rpc).toHaveBeenCalledWith('clock_in', { p_at: '2026-11-17T11:00:00Z' });
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await api.clockOut('2026-11-17T15:00:00Z')).toBeNull();
    expect(rpc).toHaveBeenCalledWith('clock_out', { p_at: '2026-11-17T15:00:00Z' });
  });

  it('maps a clock in refused for overlap', async () => {
    const { api, rpc } = makeClient();
    rpc.mockResolvedValue({ data: null, error: { message: 'overlaps_previous', code: 'P0001' } });
    await expect(api.clockIn('2026-11-17T11:00:00Z')).rejects.toMatchObject({ code: 'overlaps_previous' });
  });
});
