import { describe, expect, it } from 'vitest';

import { liveStateOf, progressStepOf, stageLabelOf, stageToneOf } from '@/components/schedule/live-status';
import type { ScheduleBooking } from '@/components/schedule/schedule-types';

const job = (over: Partial<ScheduleBooking> = {}): ScheduleBooking => ({
  id: 'j1',
  orderNumber: 'ORD-1',
  pumpId: 'p1',
  customerName: 'Acme',
  jobSiteName: 'Main St',
  startHour: 7,
  durationHours: 4,
  pourHour: 8,
  pourHours: 2,
  travelMinutes: 30,
  linkedToPrevious: false,
  volumeYards: 40,
  status: 'travel',
  operator: 'Rob Black',
  serviceDate: '2026-11-24',
  fieldStatus: 'scheduled',
  ...over,
});

const today = (hour: number) => ({ date: '2026-11-24', hour });

describe('liveStateOf', () => {
  it('is idle before anything happens', () => {
    expect(liveStateOf(job(), today(6))).toBe('idle');
  });

  it('is live once the crew leaves the shop, and while on site', () => {
    expect(liveStateOf(job({ fieldStatus: 'en_route' }), today(7.5))).toBe('live');
    expect(liveStateOf(job({ fieldStatus: 'on_site' }), today(9))).toBe('live');
    expect(liveStateOf(job({ fieldStatus: 'returning' }), today(11))).toBe('live');
  });

  it('is late when pour time comes and the crew is not on site', () => {
    expect(liveStateOf(job(), today(8))).toBe('late');
    expect(liveStateOf(job({ fieldStatus: 'en_route' }), today(8.25))).toBe('late');
  });

  it('is never late once on site, on another day, or with no operator', () => {
    expect(liveStateOf(job({ fieldStatus: 'on_site' }), today(10))).toBe('live');
    expect(liveStateOf(job({ serviceDate: '2026-11-23' }), today(10))).toBe('idle');
    expect(liveStateOf(job({ operator: null }), today(10))).toBe('idle');
  });

  it('is done when finished or the ticket is in', () => {
    expect(liveStateOf(job({ fieldStatus: 'done' }), today(12))).toBe('done');
    expect(liveStateOf(job({ hasTicket: true, fieldStatus: 'returning' }), today(12))).toBe('done');
  });

  it('shows no live state before the clock is known (server render)', () => {
    expect(liveStateOf(job(), null)).toBe('idle');
    expect(liveStateOf(job({ fieldStatus: 'on_site' }), null)).toBe('live');
  });
});

describe('stageLabelOf', () => {
  it('names the stage and says why a job is late', () => {
    expect(stageLabelOf(job({ fieldStatus: 'on_site' }), 'live')).toBe('On Site');
    expect(stageLabelOf(job(), 'late')).toBe('Late · Not On Site');
    expect(stageLabelOf(job({ fieldStatus: 'en_route' }), 'late')).toBe('Late · En Route');
  });
});

describe('progressStepOf', () => {
  it('rounds the share of the block gone by to steps of 5', () => {
    expect(progressStepOf(job(), today(6))).toBe(0);
    expect(progressStepOf(job(), today(9))).toBe(50);
    expect(progressStepOf(job(), today(8.2))).toBe(30);
    expect(progressStepOf(job(), today(13))).toBe(100);
  });

  it('has no progress on another day or without a clock', () => {
    expect(progressStepOf(job({ serviceDate: '2026-11-25' }), today(9))).toBeNull();
    expect(progressStepOf(job(), null)).toBeNull();
  });
});

describe('stageToneOf', () => {
  it('gives each stage its own colour group', () => {
    expect(stageToneOf(job({ fieldStatus: 'en_route' }), 'live')).toBe('en_route');
    expect(stageToneOf(job({ fieldStatus: 'on_site' }), 'live')).toBe('on_site');
    expect(stageToneOf(job({ fieldStatus: 'pumping' }), 'live')).toBe('on_site');
    expect(stageToneOf(job({ fieldStatus: 'returning' }), 'live')).toBe('returning');
    expect(stageToneOf(job({ fieldStatus: 'en_route' }), 'late')).toBe('late');
    expect(stageToneOf(job({ fieldStatus: 'done' }), 'done')).toBe('done');
  });
});
