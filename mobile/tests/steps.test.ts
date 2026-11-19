import {
  getJobProgressState,
  getJobBadgeInfo,
  getNextStep,
  validateStepTimeEdit,
} from '../src/features/steps';
import { OperatorJob } from '../src/api/types';

function createTestJob(overrides: Partial<OperatorJob> = {}): OperatorJob {
  return {
    id: 'test-1',
    jobNumber: 'ORD-001',
    jobName: 'Test Foundation',
    customerName: 'Test Concrete',
    site: {
      label: '123 Site St',
      street: '123 Site St',
      town: 'Town',
      lat: null,
      lng: null,
    },
    shop: {
      name: 'Test Shop',
      label: 'Shop Address',
      street: 'Shop St',
      town: 'Shop Town',
      lat: null,
      lng: null,
    },
    timezone: 'America/New_York',
    arriveShopBy: '2026-09-25T08:00:00.000Z',
    pourStartsAt: '2026-09-25T10:30:00.000Z',
    pump: { unit: '02', label: '28m boom' },
    estimatedYards: 40,
    notesForOperator: null,
    siteContact: null,
    isCancelled: false,
    changedSinceSeen: false,
    acknowledgedAt: null,
    steps: {
      arrived_shop: null,
      departed_shop: null,
      arrived_site: null,
      departed_site: null,
    },
    ticketStatus: 'not_started',
    ...overrides,
  };
}

describe('Steps and Progress Logic', () => {
  it('determines progress states accurately', () => {
    const job = createTestJob();
    expect(getJobProgressState(job)).toBe('not_acknowledged');

    job.acknowledgedAt = '2026-09-25T07:30:00.000Z';
    expect(getJobProgressState(job)).toBe('acknowledged');

    job.steps.arrived_shop = '2026-09-25T08:02:00.000Z';
    expect(getJobProgressState(job)).toBe('arrived_shop');

    job.steps.departed_shop = '2026-09-25T08:41:00.000Z';
    expect(getJobProgressState(job)).toBe('departed_shop');

    job.steps.arrived_site = '2026-09-25T09:15:00.000Z';
    expect(getJobProgressState(job)).toBe('arrived_site');

    job.steps.departed_site = '2026-09-25T11:45:00.000Z';
    expect(getJobProgressState(job)).toBe('departed_site');
  });

  it('determines badge info according to progress state', () => {
    const job = createTestJob();
    expect(getJobBadgeInfo(job)).toEqual({ label: 'New', tone: 'neutral' });

    job.acknowledgedAt = '2026-09-25T07:30:00.000Z';
    expect(getJobBadgeInfo(job)).toEqual({ label: 'Acknowledged', tone: 'primary' });

    job.steps.arrived_shop = '2026-09-25T08:02:00.000Z';
    expect(getJobBadgeInfo(job)).toEqual({ label: 'Acknowledged', tone: 'primary' });

    job.steps.departed_shop = '2026-09-25T08:41:00.000Z';
    expect(getJobBadgeInfo(job)).toEqual({ label: 'On the way to job site', tone: 'primary' });

    job.steps.arrived_site = '2026-09-25T09:15:00.000Z';
    expect(getJobBadgeInfo(job)).toBeNull();

    job.isCancelled = true;
    expect(getJobBadgeInfo(job)).toEqual({ label: 'Cancelled', tone: 'danger' });
  });

  it('determines the next step correctly', () => {
    const job = createTestJob();
    // Before acknowledgment, next step is null (must acknowledge first)
    expect(getNextStep(job)).toBeNull();

    job.acknowledgedAt = '2026-09-25T07:30:00.000Z';
    expect(getNextStep(job)).toBe('arrived_shop');

    job.steps.arrived_shop = '2026-09-25T08:02:00.000Z';
    expect(getNextStep(job)).toBe('departed_shop');

    job.steps.departed_shop = '2026-09-25T08:41:00.000Z';
    expect(getNextStep(job)).toBe('arrived_site');

    job.steps.arrived_site = '2026-09-25T09:15:00.000Z';
    expect(getNextStep(job)).toBe('departed_site');

    job.steps.departed_site = '2026-09-25T11:45:00.000Z';
    expect(getNextStep(job)).toBeNull();
  });

  it('validates step time editing boundaries', () => {
    const job = createTestJob({
      acknowledgedAt: '2026-01-01T07:00:00.000Z',
      steps: {
        arrived_shop: '2026-01-01T08:00:00.000Z',
        departed_shop: '2026-01-01T08:40:00.000Z',
        arrived_site: '2026-01-01T09:15:00.000Z',
        departed_site: null,
      },
    });

    // Editing departed_shop: must be after arrived_shop (08:00) and before arrived_site (09:15)
    expect(validateStepTimeEdit(job, 'departed_shop', '2026-01-01T08:20:00.000Z')).toEqual({
      valid: true,
    });

    // Too early (before arrived_shop)
    const tooEarly = validateStepTimeEdit(job, 'departed_shop', '2026-01-01T07:50:00.000Z');
    expect(tooEarly.valid).toBe(false);
    expect(tooEarly.error).toContain('must be after Arrived at shop');

    // Too late (after arrived_site)
    const tooLate = validateStepTimeEdit(job, 'departed_shop', '2026-01-01T09:30:00.000Z');
    expect(tooLate.valid).toBe(false);
    expect(tooLate.error).toContain('must be before Arrived at job site');
  });
});
