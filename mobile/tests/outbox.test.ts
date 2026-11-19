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
