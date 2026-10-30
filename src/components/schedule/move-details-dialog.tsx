"use client";

import { ArrowRight, Clock, TriangleAlert, Truck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** What a drag changed on one order, for the Details view behind the toast. */
export interface MoveDetails {
  title: string;
  customerName: string;
  orderNumber: string;
  pump: { from: string; to: string };
  time: { from: string; to: string };
  /** Present when the operator changed too. */
  operator?: { from: string; to: string };
  /** Things worth knowing: the job needs dispatching again, an overlap, and so on. */
  notes: string[];
  onUndo: () => void;
}

interface MoveDetailsDialogProps {
  details: MoveDetails | null;
  onClose: () => void;
}

function ChangeRow({
  icon: Icon,
  label,
  from,
  to,
  highlight = false,
}: {
  icon: typeof Truck;
  label: string;
  from: string;
  to: string;
  highlight?: boolean;
}) {
  const changed = from !== to;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5",
        changed && highlight ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-white",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          changed && highlight ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        {changed ? (
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-sm text-slate-900">
            <span className="text-slate-400 line-through decoration-slate-300">{from}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-bold">{to}</span>
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-slate-900">
            <span className="font-bold">{to}</span>
            <span className="ml-1.5 text-xs text-slate-400">no change</span>
          </p>
        )}
      </div>
    </div>
  );
}

/** Opens from the toast's Details button: what moved, what changed with it, and a way to undo it. */
export function MoveDetailsDialog({ details, onClose }: MoveDetailsDialogProps) {
  return (
    <Dialog open={details !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        {details && (
          <>
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 sm:text-lg">{details.title}</DialogTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{details.customerName}</span> · {details.orderNumber}
              </p>
            </DialogHeader>

            <div className="mt-1 space-y-2">
              <ChangeRow icon={Truck} label="Pump" from={details.pump.from} to={details.pump.to} />
              <ChangeRow icon={Clock} label="Time" from={details.time.from} to={details.time.to} />
              {details.operator && (
                <ChangeRow
                  icon={UserRound}
                  label="Operator"
                  from={details.operator.from}
                  to={details.operator.to}
                  highlight
                />
              )}
            </div>

            {details.notes.length > 0 && (
              <ul className="mt-1 space-y-1.5">
                {details.notes.map((note) => (
                  <li
                    key={note}
                    className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-snug text-slate-600"
                  >
                    <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-1 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  details.onUndo();
                  onClose();
                }}
                className="h-9 cursor-pointer px-4 text-xs font-semibold"
              >
                Undo this move
              </Button>
              <Button
                type="button"
                variant="brand"
                size="sm"
                onClick={onClose}
                className="h-9 cursor-pointer px-5 text-xs font-semibold"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
