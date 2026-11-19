import {
  workTicketDraftSchema,
  workTicketSubmitSchema,
} from '../src/features/ticket-schema';

describe('Work Ticket Schema & Validation', () => {
  const validDraft = {
    jobId: 'job-101',
    arrivedOnSiteAt: '2026-09-25T08:00:00.000Z',
    startedPourAt: '2026-09-25T08:30:00.000Z',
    finishedPourAt: '2026-09-25T11:00:00.000Z',
    departedSiteAt: '2026-09-25T11:30:00.000Z',
    yardsPumped: 42.5,
    hose3inFt: 100,
    hose4inFt: 0,
    extras: ['offsite_washout'],
    comments: 'All went smoothly',
    signerName: 'John Doe',
    signaturePng: 'data:image/png;base64,...',
    signedAt: '2026-09-25T11:20:00.000Z',
    updatedAt: new Date().toISOString(),
  };

  it('allows saving partial draft without pour times or yards', () => {
    const partialDraft = {
      jobId: 'job-101',
      arrivedOnSiteAt: null,
      startedPourAt: null,
      finishedPourAt: null,
      departedSiteAt: null,
      yardsPumped: null,
      hose3inFt: null,
      hose4inFt: null,
      extras: [],
      comments: '',
      signerName: null,
      signaturePng: null,
      signedAt: null,
      updatedAt: new Date().toISOString(),
    };

    const res = workTicketDraftSchema.safeParse(partialDraft);
    expect(res.success).toBe(true);
  });

  it('validates complete draft successfully for submission', () => {
    const res = workTicketSubmitSchema.safeParse(validDraft);
    expect(res.success).toBe(true);
  });

  it('fails submission if started pour time is missing', () => {
    const invalid = { ...validDraft, startedPourAt: null };
    const res = workTicketSubmitSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('Started pour time is required');
    }
  });

  it('fails submission if finished pour time is before started pour time', () => {
    const invalid = {
      ...validDraft,
      startedPourAt: '2026-09-25T10:00:00.000Z',
      finishedPourAt: '2026-09-25T09:30:00.000Z',
    };
    const res = workTicketSubmitSchema.safeParse(invalid);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues.some((i) => i.message.includes('after Started pour'))).toBe(true);
    }
  });

  it('fails submission if yards pumped is missing or exceeds limits', () => {
    const missingYards = { ...validDraft, yardsPumped: null };
    expect(workTicketSubmitSchema.safeParse(missingYards).success).toBe(false);

    const excessiveYards = { ...validDraft, yardsPumped: 1500 };
    expect(workTicketDraftSchema.safeParse(excessiveYards).success).toBe(false);

    const excessiveHose = { ...validDraft, hose3inFt: 2500 };
    expect(workTicketDraftSchema.safeParse(excessiveHose).success).toBe(false);
  });
});
