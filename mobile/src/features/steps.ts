import { OperatorJob, JobStep } from '@/api/types';

export const STEP_SEQUENCE: JobStep[] = [
  'arrived_shop',
  'departed_shop',
  'arrived_site',
  'departed_site',
];

export const STEP_LABELS: Record<JobStep, { action: string; completed: string }> = {
  arrived_shop: {
    action: 'Arrived at shop',
    completed: 'Arrived at shop',
  },
  departed_shop: {
    action: 'Depart shop',
    completed: 'Departed shop',
  },
  arrived_site: {
    action: 'Arrived at job site',
    completed: 'Arrived at job site',
  },
  departed_site: {
    action: 'Depart job site',
    completed: 'Departed site',
  },
};

export type JobProgressState =
  | 'not_acknowledged'
  | 'acknowledged'
  | 'arrived_shop'
  | 'departed_shop'
  | 'arrived_site'
  | 'departed_site';

export function getJobProgressState(job: OperatorJob): JobProgressState {
  if (job.steps.departed_site) return 'departed_site';
  if (job.steps.arrived_site) return 'arrived_site';
  if (job.steps.departed_shop) return 'departed_shop';
  if (job.steps.arrived_shop) return 'arrived_shop';
  if (job.acknowledgedAt) return 'acknowledged';
  return 'not_acknowledged';
}

export interface BadgeInfo {
  label: string;
  tone: 'primary' | 'neutral' | 'warning' | 'danger';
}

export function getJobBadgeInfo(job: OperatorJob): BadgeInfo | null {
  if (job.isCancelled) {
    return { label: 'Cancelled', tone: 'danger' };
  }

  const state = getJobProgressState(job);
  switch (state) {
    case 'not_acknowledged':
      return { label: 'New', tone: 'neutral' };
    case 'acknowledged':
    case 'arrived_shop':
      return { label: 'Acknowledged', tone: 'primary' };
    case 'departed_shop':
      return { label: 'On the way to job site', tone: 'primary' };
    case 'arrived_site':
    case 'departed_site':
      return null;
  }
}

export function getNextStep(job: OperatorJob): JobStep | null {
  if (!job.acknowledgedAt) return null;
  for (const step of STEP_SEQUENCE) {
    if (!job.steps[step]) {
      return step;
    }
  }
  return null;
}

export function validateStepTimeEdit(
  job: OperatorJob,
  stepToEdit: JobStep,
  newTimeIso: string
): { valid: boolean; error?: string } {
  const newDate = new Date(newTimeIso);
  const now = new Date();

  if (newDate > now) {
    return { valid: false, error: 'Step time cannot be in the future.' };
  }

  const stepIndex = STEP_SEQUENCE.indexOf(stepToEdit);

  // Check previous step
  if (stepIndex > 0) {
    const prevStep = STEP_SEQUENCE[stepIndex - 1];
    const prevTime = job.steps[prevStep];
    if (prevTime) {
      const prevDate = new Date(prevTime);
      if (newDate < prevDate) {
        const prevLabel = STEP_LABELS[prevStep].completed;
        return {
          valid: false,
          error: `This time must be after ${prevLabel}.`,
        };
      }
    }
  }

  // Check next step
  if (stepIndex < STEP_SEQUENCE.length - 1) {
    const nextStep = STEP_SEQUENCE[stepIndex + 1];
    const nextTime = job.steps[nextStep];
    if (nextTime) {
      const nextDate = new Date(nextTime);
      if (newDate > nextDate) {
        const nextLabel = STEP_LABELS[nextStep].completed;
        return {
          valid: false,
          error: `This time must be before ${nextLabel}.`,
        };
      }
    }
  }

  return { valid: true };
}
