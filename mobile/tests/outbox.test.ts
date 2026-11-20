import { ApiError } from '../src/api/types';
import type { OperatorApi } from '../src/api/operator-api';
import { outbox } from '../src/api/outbox';

describe('Outbox Queue', () => {
  beforeEach(async () => {
    await outbox.clear();
  });

  it('enqueues mutations and notifies subscribers', async () => {
    let capturedCount = 0;
    const unsub = outbox.subscribe((queue) => {
      capturedCount = queue.length;
    });

    await outbox.enqueue('acknowledge', 'job-101', { at: new Date().toISOString() });
    expect(capturedCount).toBe(1);

    await outbox.enqueue('record_step', 'job-101', {
      step: 'arrived_shop',
      at: new Date().toISOString(),
    });
    expect(capturedCount).toBe(2);

    expect(outbox.isPendingStep('job-101', 'arrived_shop')).toBe(true);
    expect(outbox.isPendingStep('job-101', 'departed_shop')).toBe(false);

    unsub();
  });
});

describe('Outbox clock actions', () => {
  const entry = { id: 't1', clockedInAt: '', clockedOutAt: null, breakMinutes: 0, jobId: null };
  const fakeApi = (over: Record<string, unknown> = {}) =>
    ({ clockIn: jest.fn().mockResolvedValue(entry), clockOut: jest.fn().mockResolvedValue(entry), ...over }) as unknown as OperatorApi;

  beforeEach(async () => {
    await outbox.clear();
  });

  it('sends clock in and clock out in order with the tap time', async () => {
    const api = fakeApi();
    await outbox.enqueue('clock_in', '', { at: '2026-11-17T11:00:00.000Z' });
    await outbox.enqueue('clock_out', '', { at: '2026-11-17T15:00:00.000Z' });
    await outbox.processQueue(api);
    expect(api.clockIn).toHaveBeenCalledWith('2026-11-17T11:00:00.000Z');
    expect(api.clockOut).toHaveBeenCalledWith('2026-11-17T15:00:00.000Z');
    expect(outbox.getQueue()).toHaveLength(0);
  });

  it('keeps a tap that failed for lack of signal', async () => {
    const api = fakeApi({ clockIn: jest.fn().mockRejectedValue(new ApiError('offline', 'No connection.')) });
    await outbox.enqueue('clock_in', '', { at: '2026-11-17T11:00:00.000Z' });
    await outbox.processQueue(api);
    expect(outbox.getQueue()).toHaveLength(1);
  });

  it('drops a refused tap and tells the listener', async () => {
    const api = fakeApi({ clockIn: jest.fn().mockRejectedValue(new ApiError('overlaps_previous', 'x')) });
    const seen: string[] = [];
    const off = outbox.onRejected((item, error) => seen.push(`${item.action}:${error.code}`));
    await outbox.enqueue('clock_in', '', { at: '2026-11-17T11:00:00.000Z' });
    await outbox.processQueue(api);
    off();
    expect(seen).toEqual(['clock_in:overlaps_previous']);
    expect(outbox.getQueue()).toHaveLength(0);
  });
});
