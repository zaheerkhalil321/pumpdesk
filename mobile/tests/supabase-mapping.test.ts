import {
  mapJob,
  mapClockEntries,
  mapClockEntry,
  mapClockEntryOrNull,
  mapJobs,
  mapOperator,
  mapTicket,
  pngDataUrlToBytes,
  ticketToPayload,
} from '@/api/supabase-mapping';
import { todayWindow, upcomingWindow } from '@/api/day-window';

const rawJob = {
  id: 'job-1',
  jobNumber: 'ORD-1525',
  jobName: 'Oak Hill Foundation',
  customerName: 'Accurate Concrete',
  site: { label: '24 Oak Hill Road', street: '24 Oak Hill Road', town: 'Litchfield', lat: 44.1, lng: -69.9 },
  shop: { name: 'Warren Yard', label: 'Warren Yard · 1 Main St', street: '1 Main St', town: null, lat: null, lng: null },
  timezone: 'America/New_York',
  arriveShopBy: '2026-11-19T14:00:00.000Z',
  pourStartsAt: '2026-11-19T15:30:00.000Z',
  pump: { unit: '02', label: '28m boom' },
  estimatedYards: '18.50',
  notesForOperator: 'Gate code 1234',
  siteContact: { name: 'Sam Lee', role: 'Super', phone: '+12075550100' },
  isCancelled: false,
  changedSinceSeen: true,
  acknowledgedAt: null,
  steps: { arrived_shop: '2026-11-19T14:00:00.000Z', departed_shop: null, arrived_site: null, departed_site: null },
  ticketStatus: 'draft',
};

describe('mapJob', () => {
  it('maps the backend JSON to an OperatorJob', () => {
    const job = mapJob(rawJob);
    expect(job.jobNumber).toBe('ORD-1525');
    expect(job.estimatedYards).toBe(18.5);
    expect(job.shop.name).toBe('Warren Yard');
    expect(job.shop.town).toBeNull();
    expect(job.pump).toEqual({ unit: '02', label: '28m boom' });
    expect(job.steps.arrived_shop).toBe('2026-11-19T14:00:00.000Z');
    expect(job.steps.departed_site).toBeNull();
    expect(job.changedSinceSeen).toBe(true);
    expect(job.ticketStatus).toBe('draft');
  });

  it('copes with missing optional parts', () => {
    const job = mapJob({ ...rawJob, pump: null, siteContact: null, steps: null, notesForOperator: null });
    expect(job.pump).toBeNull();
    expect(job.siteContact).toBeNull();
    expect(job.steps).toEqual({ arrived_shop: null, departed_shop: null, arrived_site: null, departed_site: null });
  });

  it('treats an unknown ticket status as not started', () => {
    expect(mapJob({ ...rawJob, ticketStatus: 'weird' }).ticketStatus).toBe('not_started');
  });

  it('turns a null list into an empty list and rejects non-lists', () => {
    expect(mapJobs(null)).toEqual([]);
    expect(() => mapJobs({})).toThrow();
  });
});

describe('mapOperator', () => {
  it('maps the operator and company', () => {
    const op = mapOperator({
      employeeId: 'e1',
      firstName: 'Rob',
      lastName: 'Black',
      phone: '+12075550168',
      company: { id: 'c1', name: 'Midcoast', town: 'Warren, ME', dispatchPhone: '', termsUrl: null },
    });
    expect(op.firstName).toBe('Rob');
    expect(op.company.termsUrl).toBeNull();
  });
});

describe('tickets', () => {
  it('maps a ticket and hands back the signature path', () => {
    const result = mapTicket({
      jobId: 'job-1',
      arrivedOnSiteAt: null,
      startedPourAt: '2026-11-19T16:00:00.000Z',
      finishedPourAt: null,
      departedSiteAt: null,
      yardsPumped: '12.5',
      hose3inFt: null,
      hose4inFt: 50,
      extras: ['primer_bag'],
      comments: 'ok',
      signerName: 'Sam',
      signaturePng: null,
      signaturePath: 'c1/job-1.png',
      signedAt: null,
      updatedAt: '2026-11-19T17:00:00.000Z',
    });
    expect(result?.signaturePath).toBe('c1/job-1.png');
    expect(result?.draft.yardsPumped).toBe(12.5);
    expect(result?.draft.extras).toEqual(['primer_bag']);
    expect(result?.draft.signaturePng).toBeNull();
  });

  it('returns null when there is no ticket', () => {
    expect(mapTicket(null)).toBeNull();
  });

  it('builds the save payload without the image', () => {
    const payload = ticketToPayload(
      {
        jobId: 'job-1', arrivedOnSiteAt: null, startedPourAt: null, finishedPourAt: null, departedSiteAt: null,
        yardsPumped: 5, hose3inFt: null, hose4inFt: null, extras: [], comments: '', signerName: 'Sam',
        signaturePng: 'data:image/png;base64,AAAA', signedAt: null, updatedAt: '',
      },
      'c1/job-1.png'
    );
    expect(payload.signaturePath).toBe('c1/job-1.png');
    expect(payload).not.toHaveProperty('signaturePng');
  });

  it('decodes a PNG data URL to bytes', () => {
    expect(Array.from(pngDataUrlToBytes('data:image/png;base64,AQID'))).toEqual([1, 2, 3]);
  });
});

describe('day windows (America/New_York)', () => {
  it('today starts at local midnight, in winter (UTC-5)', () => {
    const w = todayWindow(new Date('2026-11-19T17:08:00.000Z'));
    expect(w).toEqual({ from: '2026-11-19T05:00:00.000Z', to: '2026-11-20T05:00:00.000Z' });
  });

  it('uses the zone day, not the UTC day', () => {
    // 02:00 UTC on the 20th is still the evening of the 19th in Maine
    const w = todayWindow(new Date('2026-11-20T02:00:00.000Z'));
    expect(w.from).toBe('2026-11-19T05:00:00.000Z');
  });

  it('handles daylight saving (UTC-4)', () => {
    const w = todayWindow(new Date('2026-07-01T12:00:00.000Z'));
    expect(w).toEqual({ from: '2026-07-01T04:00:00.000Z', to: '2026-07-02T04:00:00.000Z' });
  });

  it('upcoming runs from tomorrow through N days ahead', () => {
    const w = upcomingWindow(14, new Date('2026-11-19T17:08:00.000Z'));
    expect(w.from).toBe('2026-11-20T05:00:00.000Z');
    expect(w.to).toBe('2026-12-04T05:00:00.000Z');
  });
});

describe('time entries', () => {
  const raw = { id: 'te-1', clock_in: '2026-11-17T11:00:00+00:00', clock_out: null, break_minutes: 15, job_id: null };

  it('maps an open entry', () => {
    expect(mapClockEntry(raw)).toEqual({
      id: 'te-1',
      clockedInAt: '2026-11-17T11:00:00.000Z',
      clockedOutAt: null,
      breakMinutes: 15,
      jobId: null,
    });
  });

  it('maps a closed entry with a job', () => {
    const e = mapClockEntry({ ...raw, clock_out: '2026-11-17T15:00:00+00:00', job_id: 'job-9' });
    expect(e.clockedOutAt).toBe('2026-11-17T15:00:00.000Z');
    expect(e.jobId).toBe('job-9');
  });

  it('maps null (never clocked in) and lists', () => {
    expect(mapClockEntryOrNull(null)).toBeNull();
    expect(mapClockEntries(null)).toEqual([]);
    expect(mapClockEntries([raw, raw]).length).toBe(2);
  });

  it('rejects an entry without a start', () => {
    expect(() => mapClockEntry({ id: 'x' })).toThrow();
    expect(() => mapClockEntries({})).toThrow();
  });
});
