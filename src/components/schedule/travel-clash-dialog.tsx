"use client";

import { Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDuration } from "@/features/orders/duration";

export interface PendingTravelClash {
  kind: "previous" | "next";
  customerName: string;
  /** The job on the same pump the travel time is measured against. */
  otherCustomerName: string;
  otherOrderNumber: string;
  /** Minutes between the two jobs; negative when they overlap. */
  gapMinutes: number;
  travelMinutes: number;
  /** Earliest pour time that leaves enough travel time, e.g. "11:00 AM". Only for "previous". */
  suggestedPourClock: string | null;
  /** The pour time the dispatcher picked. */
  chosenPourClock: string;
}

interface TravelClashDialogProps {
  clash: PendingTravelClash | null;
  onMove: () => void;
  onKeep: () => void;
  onCancel: () => void;
}

/** Asked when the time between two jobs on a pump is less than the drive between them. */
export function TravelClashDialog({ clash, onMove, onKeep, onCancel }: TravelClashDialogProps) {
  const overlaps = clash ? clash.gapMinutes < 0 : false;
  return (
    <Dialog open={clash !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {clash && (
          <>
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
                <Route className="h-5 w-5" />
              </div>
              <DialogTitle className="text-base font-bold text-slate-900 sm:text-lg">
                {overlaps ? "These jobs overlap" : "Not enough travel time"}
              </DialogTitle>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {clash.kind === "previous"
                  ? `${clash.otherCustomerName} (${clash.otherOrderNumber}) is the job before ${clash.customerName} on this pump.`
                  : `${clash.otherCustomerName} (${clash.otherOrderNumber}) is the next job after ${clash.customerName} on this pump.`}{" "}
                {overlaps
                  ? `They overlap by ${formatDuration(-clash.gapMinutes)}, and the drive takes ${formatDuration(clash.travelMinutes)}.`
                  : `There is ${formatDuration(Math.max(0, clash.gapMinutes))} between them, and the drive takes ${formatDuration(clash.travelMinutes)}.`}
              </p>
            </DialogHeader>

            <div className="mt-2 flex flex-col gap-2">
              {clash.suggestedPourClock && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onMove}
                  className="h-auto cursor-pointer justify-start whitespace-normal py-2.5 text-left"
                >
                  <span className="block">
                    <span className="block text-sm font-semibold text-slate-900">
                      Move the pour to {clash.suggestedPourClock}
                    </span>
                    <span className="block text-xs font-normal text-slate-500">
                      The earliest time that leaves the full drive. You chose {clash.chosenPourClock}.
                    </span>
                  </span>
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={onKeep}
                className="h-auto cursor-pointer justify-start whitespace-normal py-2.5 text-left"
              >
                <span className="block">
                  <span className="block text-sm font-semibold text-slate-900">
                    Keep {clash.chosenPourClock} anyway
                  </span>
                  <span className="block text-xs font-normal text-slate-500">
                    Accept the {overlaps ? "overlap" : "short drive"}. The board will mark it.
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
                Cancel, go back
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
