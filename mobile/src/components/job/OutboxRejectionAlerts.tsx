import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { outbox, OutboxActionType } from '@/api/outbox';
import { useTopAlert } from '@/components/ui';

const ACTION_LABEL: Record<OutboxActionType, string> = {
  acknowledge: 'Acknowledge',
  record_step: 'Step',
  undo_step: 'Undo',
  edit_step_time: 'Time change',
  save_ticket: 'Ticket draft',
  submit_ticket: 'Ticket',
  clock_in: 'Clock in',
  clock_out: 'Clock out',
};

/**
 * Taps are shown as done right away and sent in the background. When the server refuses one for
 * good (cancelled job, ticket already turned in, ...), tell the operator and reload the jobs so the
 * screen shows the truth again. Renders nothing.
 */
export function OutboxRejectionAlerts() {
  const { showAlert } = useTopAlert();
  const queryClient = useQueryClient();

  useEffect(
    () =>
      outbox.onRejected((item, error) => {
        showAlert(`${ACTION_LABEL[item.action]} not saved`, { message: error.message, tone: 'warning' });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['time-entries'] });
        queryClient.invalidateQueries({ queryKey: ['ticket', item.jobId] });
      }),
    [showAlert, queryClient]
  );

  return null;
}
