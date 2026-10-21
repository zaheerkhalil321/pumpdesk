'use client';

import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OperatorForm } from '@/components/operators/operator-form';
import type { BranchOption, PumpItem } from '@/features/fleet/types';

interface AddOperatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pumps: PumpItem[];
  branchOptions: BranchOption[];
  /** Pump to pre-select as the default pump. */
  initialPumpId?: string;
  onCreated?: (id: string) => void;
}

export function AddOperatorModal({
  open,
  onOpenChange,
  pumps,
  branchOptions,
  initialPumpId,
  onCreated,
}: AddOperatorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            Add new operator
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Register a pump operator to the crew roster.
          </p>
        </DialogHeader>

        {open && (
          <OperatorForm
            pumps={pumps}
            branchOptions={branchOptions}
            initialPumpId={initialPumpId}
            onClose={() => onOpenChange(false)}
            onSaved={onCreated}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
