'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ExternalLink, Loader2, Trash2, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OperatorForm } from '@/components/operators/operator-form';
import { deleteOperator } from '@/features/fleet/server/actions';
import { getOperatorJobs } from '@/features/orders/server/actions';
import type { OperatorJob } from '@/features/orders/types';
import type { BranchOption, OperatorItem, PumpItem } from '@/features/fleet/types';
import { reportAction } from '@/lib/action-feedback';
import { cn } from '@/lib/utils';

interface EditOperatorModalProps {
  operator: OperatorItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pumps: PumpItem[];
  branchOptions: BranchOption[];
}

export function EditOperatorModal({
  operator,
  open,
  onOpenChange,
  pumps,
  branchOptions,
}: EditOperatorModalProps) {
  const router = useRouter();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, startDeleting] = useTransition();
  // The open jobs this operator is on, fetched when the delete question opens.
  const [jobs, setJobs] = useState<OperatorJob[] | null>(null);
  const [jobsFailed, setJobsFailed] = useState(false);

  /** Opens the delete question and fetches the open jobs the operator is on. */
  const openDeleteDialog = () => {
    if (!operator) return;
    setJobs(null);
    setJobsFailed(false);
    setIsDeleteOpen(true);
    getOperatorJobs({ id: operator.id }).then((result) => {
      if (result.ok) setJobs(result.data);
      else setJobsFailed(true);
    });
  };

  if (!operator) return null;

  const handleDelete = () => {
    startDeleting(async () => {
      const result = await deleteOperator({ id: operator.id });
      if (!reportAction(result, { entity: 'operator', refresh: () => router.refresh() })) return;
      setIsDeleteOpen(false);
      onOpenChange(false);
      // Their own page no longer exists, so go back to the list instead of staying on it.
      router.push('/operators');
      toast.success('Operator deleted', {
        description: `${operator.name} was removed from the roster and from their open jobs.`,
      });
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="grid-cols-[minmax(0,1fr)] max-sm:top-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-none max-sm:h-dvh max-sm:max-h-none max-sm:rounded-none max-sm:border-0 sm:max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
              Edit operator profile
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Update contact details, pump assignment and credentials.
            </p>
          </DialogHeader>

          <OperatorForm
            key={`${operator.id}-${open}`}
            operator={operator}
            pumps={pumps}
            branchOptions={branchOptions}
            onClose={() => onOpenChange(false)}
            onDelete={openDeleteDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation (soft delete: the record is kept). Lists the jobs they would come off. */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-2">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
              Delete {operator.name}?
            </DialogTitle>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {jobs === null && !jobsFailed
                ? 'Checking their upcoming jobs...'
                : jobsFailed
                  ? "Couldn't check their upcoming jobs. Deleting still takes them off any open jobs."
                  : jobs && jobs.length > 0
                    ? `${operator.name} is on ${jobs.length} upcoming ${jobs.length === 1 ? 'job' : 'jobs'}. Deleting them takes them off, and each will show "needs operator".`
                    : `${operator.name} is not on any upcoming jobs. They will just leave the roster.`}
            </p>
          </DialogHeader>

          {jobs === null && !jobsFailed && (
            <div className="flex items-center justify-center py-6 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {jobs && jobs.length > 0 && (
            <>
              <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <a
                      href={`/orders/${job.jobNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                          <span className="truncate">{job.customerName}</span>
                          <span className="shrink-0 text-xs font-medium text-slate-400">{job.jobNumber}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {[job.dateLabel, job.timeLabel, job.pumpCode, job.isAdditionalOperator ? 'Additional operator' : '']
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            job.dispatched ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500',
                          )}
                        >
                          {job.dispatched ? 'Dispatched' : 'Draft'}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-slate-500" />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {jobs.some((job) => job.dispatched) && (
                <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-800">
                  <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>
                    {jobs.filter((job) => job.dispatched).length === 1 ? 'One of these was' : 'Some of these were'} already
                    sent to {operator.name}. Each will need a new operator and to be dispatched again.
                  </span>
                </p>
              )}
              <p className="text-[11px] text-slate-400">Finished jobs keep their name.</p>
            </>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              className="h-9 px-4 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleDelete}
              className="h-9 px-4 text-xs font-semibold cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? 'Deleting...' : jobs && jobs.length > 0 ? `Delete and free ${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}` : 'Delete operator'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
