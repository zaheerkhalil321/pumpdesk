"use client";

import { Plus, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScheduleEmptyStateProps {
  onNewBookingClick: () => void;
}

export function ScheduleEmptyState({ onNewBookingClick }: ScheduleEmptyStateProps) {
  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-8 sm:p-10 flex flex-col items-center justify-center text-center shadow-2xs">
      {/* Pump Icon */}
      <div className="h-13 w-13 rounded-2xl bg-brand-light border border-brand/20 flex items-center justify-center text-brand shadow-2xs mb-3">
        <Truck className="h-6 w-6 stroke-[1.8]" />
      </div>

      {/* Primary Message */}
      <h3 className="text-base font-bold text-slate-900 tracking-tight">
        Your schedule is clear
      </h3>

      {/* Action Button */}
      <Button
        onClick={onNewBookingClick}
        className="mt-4 h-9 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold gap-1.5 shadow-2xs transition-all cursor-pointer hover:shadow-xs active:scale-98"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>New booking</span>
      </Button>
    </div>
  );
}
