"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Heading, Paragraph } from "@/components/ui/typography";
import { ScheduleDateHeader } from "@/components/schedule/schedule-date-header";
import type { DayCounts } from "@/features/orders/types";

interface ScheduleHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  dayCounts: DayCounts;
  onNewBookingClick: () => void;
}

/** Title on the left, the open day in the middle (wide screens), New booking on the right. */
export function ScheduleHeader({ currentDate, onDateChange, dayCounts, onNewBookingClick }: ScheduleHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border pb-4 sm:items-center min-[1400px]:grid min-[1400px]:grid-cols-[auto_1fr_auto] min-[1400px]:gap-6">
      <div className="min-w-0">
        <Heading level={2} className="tracking-tight">
          Schedule
        </Heading>
        <Paragraph size="sm" variant="muted" className="mt-0.5">
          Plan crews, pumps, and jobs
        </Paragraph>
      </div>

      {/* Narrower screens have it in the toolbar below, phones their own */}
      <ScheduleDateHeader
        currentDate={currentDate}
        onDateChange={onDateChange}
        dayCounts={dayCounts}
        className="hidden min-[1400px]:flex min-[1400px]:justify-self-center"
      />

      <Button
        variant="brand"
        onClick={onNewBookingClick}
        className="hidden sm:inline-flex justify-self-end font-semibold gap-1.5 text-sm h-9 px-3.5"
      >
        <Plus className="h-4 w-4" />
        <span>New booking</span>
      </Button>
    </div>
  );
}
