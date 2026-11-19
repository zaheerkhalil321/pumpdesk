import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, outbox, OperatorJob, JobStep } from '@/api';

export function useTodayJobs() {
  return useQuery<OperatorJob[]>({
    queryKey: ['jobs', 'today'],
    queryFn: () => api.listToday(),
  });
}

export function useUpcomingJobs(days: number = 14) {
  return useQuery<OperatorJob[]>({
    queryKey: ['jobs', 'upcoming', days],
    queryFn: () => api.listUpcoming(days),
  });
}

export function useJob(jobId: string) {
  return useQuery<OperatorJob>({
    queryKey: ['jobs', jobId],
    queryFn: () => api.getJob(jobId),
    enabled: !!jobId,
  });
}

export function useAcknowledgeJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, at }: { jobId: string; at: string }) => {
      // Optimistic update
      queryClient.setQueryData<OperatorJob[]>(['jobs', 'today'], (old) => {
        if (!old) return old;
        return old.map((j) => (j.id === jobId ? { ...j, acknowledgedAt: at } : j));
      });
      queryClient.setQueryData<OperatorJob>(['jobs', jobId], (old) => {
        if (!old) return old;
        return { ...old, acknowledgedAt: at };
      });

      // Queue in outbox
      await outbox.enqueue('acknowledge', jobId, { at });
      // Attempt immediate processing
      await outbox.processQueue(api);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useRecordJobStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      step,
      at,
    }: {
      jobId: string;
      step: JobStep;
      at: string;
    }) => {
      // Optimistic update
      queryClient.setQueryData<OperatorJob>(['jobs', jobId], (old) => {
        if (!old) return old;
        return {
          ...old,
          steps: {
            ...old.steps,
            [step]: at,
          },
        };
      });

      await outbox.enqueue('record_step', jobId, { step, at });
      await outbox.processQueue(api);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'today'] });
    },
  });
}

export function useUndoJobStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, step }: { jobId: string; step: JobStep }) => {
      queryClient.setQueryData<OperatorJob>(['jobs', jobId], (old) => {
        if (!old) return old;
        return {
          ...old,
          steps: {
            ...old.steps,
            [step]: null,
          },
        };
      });

      await outbox.enqueue('undo_step', jobId, { step });
      await outbox.processQueue(api);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'today'] });
    },
  });
}

export function useEditStepTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jobId,
      step,
      at,
    }: {
      jobId: string;
      step: JobStep;
      at: string;
    }) => {
      queryClient.setQueryData<OperatorJob>(['jobs', jobId], (old) => {
        if (!old) return old;
        return {
          ...old,
          steps: {
            ...old.steps,
            [step]: at,
          },
        };
      });

      await outbox.enqueue('edit_step_time', jobId, { step, at });
      await outbox.processQueue(api);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'today'] });
    },
  });
}
