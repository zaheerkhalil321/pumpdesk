"use client";

import { UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface OperatorRef {
  id: string;
  name: string;
}

export interface PendingOperatorSwap {
  customerName: string;
  pumpCode: string;
  /** Who the job was already sent to. */
  current: OperatorRef;
  /** Who usually drives the pump it is being moved to. */
  usual: OperatorRef;
}

interface OperatorSwapDialogProps {
  swap: PendingOperatorSwap | null;
  onKeep: () => void;
  onSwitch: () => void;
  onCancel: () => void;
}

/** Asked when a job that was already dispatched is dragged to a pump with a different usual operator. */
export function OperatorSwapDialog({ swap, onKeep, onSwitch, onCancel }: OperatorSwapDialogProps) {
  return (
    <Dialog open={swap !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {swap && (
          <>
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
                <UserRoundCog className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900 sm:text-lg">
                {swap.current.name} already has this job
              </DialogTitle>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {swap.customerName} was sent to {swap.current.name}. {swap.pumpCode} usually has{" "}
                {swap.usual.name}. Who should do this pour?
              </p>
            </DialogHeader>

            <div className="mt-2 flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onKeep}
                className="h-auto cursor-pointer justify-start whitespace-normal py-2.5 text-left"
              >
                <span className="block">
                  <span className="block text-sm font-semibold text-slate-900">Keep {swap.current.name}</span>
                  <span className="block text-xs font-normal text-slate-500">
                    Only the pump changes. Nothing needs sending again.
                  </span>
                </span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSwitch}
                className="h-auto cursor-pointer justify-start whitespace-normal py-2.5 text-left"
              >
                <span className="block">
                  <span className="block text-sm font-semibold text-slate-900">Switch to {swap.usual.name}</span>
                  <span className="block text-xs font-normal text-slate-500">
                    {swap.usual.name} will need the job dispatched again.
                  </span>
                </span>
              </Button>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="h-9 cursor-pointer px-4 text-xs font-semibold text-slate-600"
              >
                Cancel, leave it where it was
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
