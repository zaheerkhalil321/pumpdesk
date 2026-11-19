import { z } from 'zod';

export const workTicketDraftSchema = z.object({
  jobId: z.string(),
  arrivedOnSiteAt: z.string().nullable(),
  startedPourAt: z.string().nullable(),
  finishedPourAt: z.string().nullable(),
  departedSiteAt: z.string().nullable(),
  yardsPumped: z
    .number()
    .min(0, 'Yards must be at least 0')
    .max(1000, 'Yards cannot exceed 1000')
    .nullable(),
  hose3inFt: z
    .number()
    .min(0, 'Hose must be at least 0')
    .max(2000, 'Hose cannot exceed 2000 ft')
    .nullable(),
  hose4inFt: z
    .number()
    .min(0, 'Hose must be at least 0')
    .max(2000, 'Hose cannot exceed 2000 ft')
    .nullable(),
  extras: z.array(z.string()),
  comments: z.string(),
  signerName: z.string().nullable(),
  signaturePng: z.string().nullable(),
  signedAt: z.string().nullable(),
  updatedAt: z.string(),
});

export const workTicketSubmitSchema = workTicketDraftSchema.superRefine((data, ctx) => {
  if (!data.startedPourAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Started pour time is required to submit.',
      path: ['startedPourAt'],
    });
  }

  if (!data.finishedPourAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Finished pour time is required to submit.',
      path: ['finishedPourAt'],
    });
  }

  if (data.startedPourAt && data.finishedPourAt) {
    const started = new Date(data.startedPourAt);
    const finished = new Date(data.finishedPourAt);
    if (finished <= started) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Finished pour must be after Started pour.',
        path: ['finishedPourAt'],
      });
    }
  }

  if (data.yardsPumped === null || data.yardsPumped === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Yards pumped is required to submit.',
      path: ['yardsPumped'],
    });
  }
});

export type WorkTicketFormData = z.infer<typeof workTicketDraftSchema>;
