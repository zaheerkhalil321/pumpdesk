"use client";

import { Info } from "lucide-react";

export function ScheduleLegend() {
  return (
    <div className="flex items-center gap-1.5 pt-2 text-xs text-slate-500">
      {/* ── Left: Dispatch Helper Note ── */}
      <Info className="h-4 w-4 text-slate-400 shrink-0" />
      <span>Click a time slot to book &bull; Drag bookings to reschedule</span>
    </div>
  );
}
