import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, outbox, WorkTicketDraft, TicketExtra } from '@/api';

export function useTicket(jobId: string) {
  return useQuery<WorkTicketDraft | null>({
    queryKey: ['ticket', jobId],
    queryFn: () => api.getTicket(jobId),
    enabled: !!jobId,
  });
}

export function useTicketExtras() {
  return useQuery<TicketExtra[]>({
    queryKey: ['ticketExtras'],
    queryFn: () => api.getTicketExtras(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

export function useSaveTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draft: WorkTicketDraft) => {
      queryClient.setQueryData<WorkTicketDraft>(['ticket', draft.jobId], draft);
      await outbox.enqueue('save_ticket', draft.jobId, { draft });
      await outbox.processQueue(api);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', variables.jobId] });
    },
  });
}

export function useSubmitTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      await outbox.enqueue('submit_ticket', jobId);
      await outbox.processQueue(api);
    },
    onSettled: (_data, _error, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs', 'today'] });
    },
  });
}
