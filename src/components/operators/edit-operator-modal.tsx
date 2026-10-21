'use client';

import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OperatorForm } from '@/components/operators/operator-form';
import type { BranchOption, OperatorItem, PumpItem } from '@/features/fleet/types';

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
  if (!operator) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
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
        />
      </DialogContent>
    </Dialog>
  );
}
